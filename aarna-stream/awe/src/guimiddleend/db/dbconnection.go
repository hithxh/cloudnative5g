package db

import (
	"encoding/json"
	"sort"

	pkgerrors "github.com/pkg/errors"
	log "github.com/sirupsen/logrus"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
	"golang.org/x/net/context"
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
	Find(coll string, key Key, tag string) ([][]byte, error)
	Insert(coll string, key Key, query interface{}, tag string, data interface{}) error
	Unmarshal(inp []byte, out interface{}) error
	CheckCollectionExists(coll string) bool
	//Update(coll string, query interface{}, data interface{}) error
	Update(coll string, operation string,
		vars map[string]string, appName string, data interface{}) error
	Delete(coll string, vars map[string]string) error
	Remove(coll string, key Key) error
	RemoveAll(coll string, key Key) error
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
func (m *MongoStore) findFilterWithKey(key Key) (primitive.M, error) {

	var bsonMap bson.M
	var bsonMapFinal bson.M
	st, err := json.Marshal(key)
	if err != nil {
		return primitive.M{}, pkgerrors.Errorf("Error Marshalling key: %s", err.Error())
	}
	err = json.Unmarshal([]byte(st), &bsonMap)
	if err != nil {
		return primitive.M{}, pkgerrors.Errorf("Error Unmarshalling key to Bson Map: %s", err.Error())
	}
	bsonMapFinal = make(bson.M)
	for k, v := range bsonMap {
		if v == "" {
			if _, ok := bsonMapFinal["key"]; !ok {
				// add type of key to filter
				s, err := m.createKeyField(key)
				if err != nil {
					return primitive.M{}, err
				}
				bsonMapFinal["key"] = s
			}
		} else {
			bsonMapFinal[k] = v
		}
	}
	filter := bson.M{
		"$and": []bson.M{bsonMapFinal},
	}
	return filter, nil
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

// validateParams checks to see if any parameters are empty
func (m *MongoStore) validateParams(args ...interface{}) bool {
	for _, v := range args {
		val, ok := v.(string)
		if ok {
			if val == "" {
				return false
			}
		} else {
			if v == nil {
				return false
			}
		}
	}

	return true
}

// CreateDBClient creates the DB client. currently only mongo
func CreateDBClient(dbType string, dbName string, svcEp string) error {
	var err error
	switch dbType {
	case "mongo":
		DBconn, err = NewMongoStore(dbName, nil, svcEp)
	default:
		log.Error(dbType + "DB not supported")
	}
	return err
}

// HealthCheck verifies the database connection
func (m *MongoStore) HealthCheck() error {
	_, err := (*mongo.SingleResult).DecodeBytes(m.db.RunCommand(context.Background(), bson.D{{"serverStatus", 1}}))
	if err != nil {
		log.Error("Error getting DB server status: err %s", err)
	}
	return nil
}

func (m *MongoStore) Unmarshal(inp []byte, out interface{}) error {
	err := bson.Unmarshal(inp, out)
	if err != nil {
		log.Error("Failed to unmarshall bson")
		return err
	}
	return nil
}

// Check if given collection exists in database
func (m *MongoStore) CheckCollectionExists(coll string) bool {
	names, err := m.db.ListCollectionNames(context.Background(), bson.D{})
	if err != nil {
		log.Error("Failed to fetch collection names: %s", err)
		return false
	}

	for _, name := range names {
		if name == coll {
			log.Infof("Collection %s exists", coll)
			return true
		}
	}
	return false
}

// Insert is used to insert/add element to a document
func (m *MongoStore) Insert(coll string, key Key, query interface{}, tag string, data interface{}) error {
	if data == nil || !m.validateParams(coll, key, tag) {
		return pkgerrors.New("No Data to store")
	}

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

// Find a document
func (m *MongoStore) Find(coll string, key Key, tag string) ([][]byte, error) {

	//result, err := m.findInternal(coll, key, tag, "")
	//return result, err
	if !m.validateParams(coll, key, tag) {
		return nil, pkgerrors.New("Mandatory fields are missing")
	}

	filter, err := m.findFilterWithKey(key)
	if err != nil {
		return nil, err
	}

	log.Infof("mongo filter %+v : tag %s", filter, tag)
	projection := bson.D{
		{tag, 1},
		{"_id", 0},
	}

	c := m.db.Collection(coll)

	cursor, err := c.Find(context.Background(), filter, options.Find().SetProjection(projection))
	if err != nil {
		log.Errorf("Failed to find the document: %s", err)
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
				log.Errorf("Unable to read data: %s err: %s", string(r.Value), err)
			}
			data = r.Value
		}
		result = append(result, data)
	}
	return result, nil
}

// Update is used to add element to a document
func (m *MongoStore) Update(coll string, operation string,
	vars map[string]string, appName string, data interface{}) error {
	c := m.db.Collection(coll)

	var query bson.M
	var dbUpdateContent bson.M
	switch operation {
	case "UpdateApplication":
		query = bson.M{"project": vars["project-name"], "compositeapp": vars["composite-app-name"],
			"compositeappversion": vars["version"], "appmetadata.spec.apps": bson.M{"$elemMatch": bson.M{"metadata.name": appName}}}
		dbUpdateContent = bson.M{"$set": bson.M{"appmetadata.spec.apps.$": data}}
	case "AddApplication":
		query = bson.M{"project": vars["project-name"], "compositeapp": vars["composite-app-name"],
			"compositeappversion": vars["version"]}
		dbUpdateContent = bson.M{"$push": bson.M{"appmetadata.spec.apps": data}}
	case "UpdateProfile":
		query = bson.M{"project": vars["project-name"], "compositeapp": vars["composite-app-name"],
			"compositeappversion": vars["version"], "appmetadata.spec.compositeProfiles.0.spec.profile": bson.M{"$elemMatch": bson.M{"spec.appname": appName}}}
		dbUpdateContent = bson.M{"$set": bson.M{"appmetadata.spec.compositeProfiles.0.spec.profile.$": data}}
	case "AddProfile":
		query = bson.M{"project": vars["project-name"], "compositeapp": vars["composite-app-name"],
			"compositeappversion": vars["version"]}
		dbUpdateContent = bson.M{"$push": bson.M{"appmetadata.spec.compositeProfiles.0.spec.profile": data}}
	case "DeleteApplication":
		query = bson.M{"project": vars["project-name"], "compositeapp": vars["composite-app-name"],
			"compositeappversion": vars["version"]}
		dbUpdateContent = bson.M{"$pull": bson.M{"appmetadata.spec.apps": bson.M{"metadata.name": vars["app-name"]}}}
	case "DeleteProfile":
		query = bson.M{"project": vars["project-name"], "compositeapp": vars["composite-app-name"],
			"compositeappversion": vars["version"]}
		dbUpdateContent = bson.M{"$pull": bson.M{"appmetadata.spec.compositeProfiles.0.spec.profile": bson.M{"spec.appname": vars["app-name"]}}}
	}

	updatedResult, err := c.UpdateOne(context.Background(), query, dbUpdateContent)
	if err != nil {
		log.Errorf("Encountered error while update of document: %s", err)
		return err
	}
	log.Infof("Updated document is: %s", updatedResult)
	return nil
}

// Delete is used to delete the document
func (m *MongoStore) Delete(coll string, vars map[string]string) error {
	c := m.db.Collection(coll)
	query := bson.M{"project": vars["project-name"], "compositeapp": vars["composite-app-name"],
		"compositeappversion": vars["version"]}
	_, err := c.DeleteOne(context.Background(), query)
	if err != nil {
		log.Errorf("Encountered error while removing the document: %s", err)
		return err
	}
	return nil
}

// RemoveAll method to removes all the documet matching key
func (m *MongoStore) RemoveAll(coll string, key Key) error {
	if !m.validateParams(coll, key) {
		return pkgerrors.New("Mandatory fields are missing")
	}
	c := m.db.Collection(coll)
	ctx := context.Background()
	filter, err := m.findFilter(key)
	if err != nil {
		return err
	}
	_, err = c.DeleteMany(ctx, filter)
	if err != nil {
		return pkgerrors.Errorf("Error Deleting from database: %s", err.Error())
	}
	return nil
}

func (m *MongoStore) Remove(coll string, key Key) error {
	if !m.validateParams(coll, key) {
		return pkgerrors.New("Mandatory fields are missing")
	}
	c := m.db.Collection(coll)
	ctx := context.Background()
	filter, err := m.findFilter(key)
	if err != nil {
		return err
	}
	count, err := c.CountDocuments(context.Background(), filter)
	if err != nil {
		return pkgerrors.Errorf("Error finding: %s", err.Error())
	}
	if count == 0 {
		return pkgerrors.Errorf("key not found")
	}
	if count > 1 {
		return pkgerrors.Errorf("Can't delete parent without deleting child references first")
	}
	_, err = c.DeleteOne(ctx, filter)
	if err != nil {
		return pkgerrors.Errorf("Error Deleting from database: %s", err.Error())
	}
	return nil
}
