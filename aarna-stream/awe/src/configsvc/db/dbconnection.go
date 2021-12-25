package db

import (
	"encoding/json"
	"fmt"
	"sort"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
	"golang.org/x/net/context"
	"go.mongodb.org/mongo-driver/bson/primitive"
	pkgerrors "github.com/pkg/errors"
)

// MongoStore is the interface which implements the db.Store interface
type MongoStore struct {
	db *mongo.Database
}

// Key interface
type Key interface {
}

// DBconn variable of type Store
var DBconn Store

// Store Interface which implements the data store functions
type Store interface {
	HealthCheck() error
	Find(coll string, key []byte, tag string) ([][]byte, error)
	Insert(coll string, key Key, query interface{}, tag string, data interface{}) error
	Unmarshal(inp []byte, out interface{}) error
}

// NewMongoStore Return mongo client
func NewMongoStore(name string, store *mongo.Database, svcEp string) (Store, error) {
	if store == nil {
		ip := "mongodb://" + svcEp
		clientOptions := options.Client()
		clientOptions.ApplyURI(ip)
		mongoClient, err := mongo.NewClient(clientOptions)
		if err != nil {
			return nil, err
		}

		err = mongoClient.Connect(context.Background())
		if err != nil {
			return nil, err
		}
		store = mongoClient.Database(name)
	}
	return &MongoStore{
		db: store,
	}, nil
}

// CreateDBClient creates the DB client. currently only mongo
func CreateDBClient(dbType string, dbName string, svcEp string) error {
	var err error
	switch dbType {
	case "mongo":
		DBconn, err = NewMongoStore(dbName, nil, svcEp)
	default:
		fmt.Println(dbType + "DB not supported")
	}
	return err
}

// HealthCheck verifies the database connection
func (m *MongoStore) HealthCheck() error {
	_, err := (*mongo.SingleResult).DecodeBytes(m.db.RunCommand(context.Background(), bson.D{{"serverStatus", 1}}))
	if err != nil {
		fmt.Println("Error getting DB server status: err %s", err)
	}
	return nil
}

func (m *MongoStore) Unmarshal(inp []byte, out interface{}) error {
	err := bson.Unmarshal(inp, out)
	if err != nil {
		fmt.Printf("Failed to unmarshall bson")
		return err
	}
	return nil
}

// Find a document
func (m *MongoStore) Find(coll string, key []byte, tag string) ([][]byte, error) {
	var bsonMap bson.M
	err := json.Unmarshal([]byte(key), &bsonMap)
	if err != nil {
		fmt.Println("Failed to unmarshall %s\n", key)
		return nil, err
	}

	filter := bson.M{
		"$and": []bson.M{bsonMap},
	}

	fmt.Printf("%+v %s\n", filter, tag)
	projection := bson.D{
		{tag, 1},
		{"_id", 0},
	}

	c := m.db.Collection(coll)

	cursor, err := c.Find(context.Background(), filter, options.Find().SetProjection(projection))
	if err != nil {
		fmt.Println("Failed to find the document %s\n", err)
		return nil, err
	}

	defer cursor.Close(context.Background())
	var data []byte
	var result [][]byte
	for cursor.Next(context.Background()) {
		d := cursor.Current
		switch d.Lookup(tag).Type {
		case bson.TypeString:
			data = []byte(d.Lookup(tag).StringValue())
		default:
			r, err := d.LookupErr(tag)
			if err != nil {
				fmt.Println("Unable to read data %s %s\n", string(r.Value), err)
			}
			data = r.Value
		}
		result = append(result, data)
	}
	return result, nil
}
func (m *MongoStore) updateFilter(key interface{}) (primitive.M, error) {

	var n map[string]string
	st, err := json.Marshal(key)
	if err != nil {
		return primitive.M{}, pkgerrors.Errorf("Error Marshalling key: %s", err.Error())
	}
	err = json.Unmarshal([]byte(st), &n)
	if err != nil {
		return primitive.M{}, pkgerrors.Errorf("Error Unmarshalling key to Bson Map: %s", err.Error())
	}
	p := make(bson.M, len(n))
	for k, v := range n {
		p[k] = v
	}
	filter := bson.M{
		"$set": p,
	}
	return filter, nil
}

func (m *MongoStore) createKeyField(key interface{}) (string, error) {

	var n map[string]string
	st, err := json.Marshal(key)
	if err != nil {
		return "", pkgerrors.Errorf("Error Marshalling key: %s", err.Error())
	}
	err = json.Unmarshal([]byte(st), &n)
	if err != nil {
		return "", pkgerrors.Errorf("Error Unmarshalling key to Bson Map: %s", err.Error())
	}
	var keys []string
	for k := range n {
		keys = append(keys, k)
	}
	sort.Strings(keys)
	s := "{"
	for _, k := range keys {
		s = s + k + ","
	}
	s = s + "}"
	return s, nil
}

func (m *MongoStore) findFilter(key Key) (primitive.M, error) {

	var bsonMap bson.M
	st, err := json.Marshal(key)
	if err != nil {
		return primitive.M{}, pkgerrors.Errorf("Error Marshalling key: %s", err.Error())
	}
	err = json.Unmarshal([]byte(st), &bsonMap)
	if err != nil {
		return primitive.M{}, pkgerrors.Errorf("Error Unmarshalling key to Bson Map: %s", err.Error())
	}
	filter := bson.M{
		"$and": []bson.M{bsonMap},
	}
	return filter, nil
}
var decodeBytes = func(sr *mongo.SingleResult) (bson.Raw, error) {
	return sr.DecodeBytes()
}

// Insert is used to insert/add element to a document
func (m *MongoStore) Insert(coll string, key Key, query interface{}, tag string, data interface{}) error {

	c := m.db.Collection(coll)
	ctx := context.Background()

	filter, err := m.findFilter(key)
	if err != nil {
		return err
	}
	// Create and add key tag
	s, err := m.createKeyField(key)
	if err != nil {
		return err
	}
	_, err = decodeBytes(
		c.FindOneAndUpdate(
			ctx,
			filter,
			bson.D{
				{"$set", bson.D{
					{tag, data},
					{"key", s},
				}},
			},
			options.FindOneAndUpdate().SetUpsert(true).SetReturnDocument(options.After)))

	if err != nil {
		return pkgerrors.Errorf("Error updating master table: %s", err.Error())
	}
	if query == nil {
		return nil
	}

	// Update to add Query fields
	update, err := m.updateFilter(query)
	if err != nil {
		return err
	}
	_, err = c.UpdateOne(
		ctx,
		filter,
		update)

	if err != nil {
		return pkgerrors.Errorf("Error updating Query fields: %s", err.Error())
	}
	return nil
}
