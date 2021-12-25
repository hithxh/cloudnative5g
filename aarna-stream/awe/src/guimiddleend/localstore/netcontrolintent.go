package localstore

import (
	"strings"

	"example.com/middleend/db"

	pkgerrors "github.com/pkg/errors"
)

// NetControlIntent contains the parameters needed for dynamic networks
type NetControlIntent struct {
	Metadata Metadata `json:"metadata"`
}

const CNI_TYPE_OVN4NFV string = "ovn4nfv"

var CNI_TYPES = [...]string{CNI_TYPE_OVN4NFV}

// It implements the interface for managing the ClusterProviders
const MAX_DESCRIPTION_LEN int = 1024
const MAX_USERDATA_LEN int = 4096

type ClientDbInfo struct {
	storeName  string // name of the mongodb collection to use for client documents
	tagMeta    string // attribute key name for the json data of a client document
	tagContent string // attribute key name for the file data of a client document
	tagContext string // attribute key name for context object in App Context
}

type Metadata struct {
	Name        string `json:"name"`
	Description string `json:"description"`
	UserData1   string `json:"userData1"`
	UserData2   string `json:"userData2"`
}

// NetControlIntentKey is the key structure that is used in the database
type NetControlIntentKey struct {
	NetControlIntent    string `json:"netcontrolintent"`
	Project             string `json:"project"`
	CompositeApp        string `json:"compositeapp"`
	CompositeAppVersion string `json:"compositeappversion"`
	DigName             string `json:"deploymentintentgroup"`
}

// Manager is an interface exposing the NetControlIntent functionality
type NetControlIntentManager interface {
	CreateNetControlIntent(nci NetControlIntent, project, compositeapp, compositeappversion, dig string, exists bool) (NetControlIntent, error)
	GetNetControlIntent(name, project, compositeapp, compositeappversion, dig string) (NetControlIntent, error)
	GetNetControlIntents(project, compositeapp, compositeappversion, dig string) ([]NetControlIntent, error)
	DeleteNetControlIntent(name, project, compositeapp, compositeappversion, dig string) error
}

// NetControlIntentClient implements the Manager
// It will also be used to maintain some localized state
type NetControlIntentClient struct {
	db ClientDbInfo
}

// NewNetControlIntentClient returns an instance of the NetControlIntentClient
// which implements the Manager
func NewNetControlIntentClient() *NetControlIntentClient {
	return &NetControlIntentClient{
		db: ClientDbInfo{
			storeName: "orchestrator",
			tagMeta:   "netcontrolintentmetadata",
		},
	}
}

// CreateNetControlIntent - create a new NetControlIntent
func (v *NetControlIntentClient) CreateNetControlIntent(nci NetControlIntent, project, compositeapp, compositeappversion, dig string, exists bool) (NetControlIntent, error) {

	//Construct key and tag to select the entry
	key := NetControlIntentKey{
		NetControlIntent:    nci.Metadata.Name,
		Project:             project,
		CompositeApp:        compositeapp,
		CompositeAppVersion: compositeappversion,
		DigName:             dig,
	}

	//Check if this NetControlIntent already exists
	_, err := v.GetNetControlIntent(nci.Metadata.Name, project, compositeapp, compositeappversion, dig)
	if err == nil && !exists {
		return NetControlIntent{}, pkgerrors.New("NetControlIntent already exists")
	}

	err = db.DBconn.Insert(v.db.storeName, key, nil, v.db.tagMeta, nci)
	if err != nil {
		return NetControlIntent{}, pkgerrors.Wrap(err, "Creating DB Entry")
	}

	return nci, nil
}

// GetNetControlIntent returns the NetControlIntent for corresponding name
func (v *NetControlIntentClient) GetNetControlIntent(name, project, compositeapp, compositeappversion, dig string) (NetControlIntent, error) {

	//Construct key and tag to select the entry
	key := NetControlIntentKey{
		NetControlIntent:    name,
		Project:             project,
		CompositeApp:        compositeapp,
		CompositeAppVersion: compositeappversion,
		DigName:             dig,
	}

	value, err := db.DBconn.Find(v.db.storeName, key, v.db.tagMeta)
	if err != nil {
		return NetControlIntent{}, pkgerrors.Wrap(err, "db Find error")
	}

	//value is a byte array
	if value != nil {
		nci := NetControlIntent{}
		err = db.DBconn.Unmarshal(value[0], &nci)
		if err != nil {
			return NetControlIntent{}, pkgerrors.Wrap(err, "Unmarshalling Value")
		}
		return nci, nil
	}

	return NetControlIntent{}, pkgerrors.New("Error getting NetControlIntent")
}

// GetNetControlIntentList returns all of the NetControlIntent for corresponding name
func (v *NetControlIntentClient) GetNetControlIntents(project, compositeapp, compositeappversion, dig string) ([]NetControlIntent, error) {

	//Construct key and tag to select the entry
	key := NetControlIntentKey{
		NetControlIntent:    "",
		Project:             project,
		CompositeApp:        compositeapp,
		CompositeAppVersion: compositeappversion,
		DigName:             dig,
	}

	var resp []NetControlIntent
	values, err := db.DBconn.Find(v.db.storeName, key, v.db.tagMeta)
	if err != nil {
		return []NetControlIntent{}, pkgerrors.Wrap(err, "db Find error")
	}

	for _, value := range values {
		nci := NetControlIntent{}
		err = db.DBconn.Unmarshal(value, &nci)
		if err != nil {
			return []NetControlIntent{}, pkgerrors.Wrap(err, "Unmarshalling Value")
		}
		resp = append(resp, nci)
	}

	return resp, nil
}

// WorkloadIntent contains the parameters needed for dynamic networks
type WorkloadIntent struct {
	Metadata Metadata           `json:"metadata"`
	Spec     WorkloadIntentSpec `json:"spec"`
}

type WorkloadIntentSpec struct {
	AppName          string `json:"application-name"`
	WorkloadResource string `json:"workload-resource"`
	Type             string `json:"type"`
}

// WorkloadIntentKey is the key structure that is used in the database
type WorkloadIntentKey struct {
	Project             string `json:"provider"`
	CompositeApp        string `json:"compositeapp"`
	CompositeAppVersion string `json:"compositeappversion"`
	DigName             string `json:"deploymentintentgroup"`
	NetControlIntent    string `json:"netcontrolintent"`
	WorkloadIntent      string `json:"workloadintent"`
}

// Manager is an interface exposing the WorkloadIntent functionality
type WorkloadIntentManager interface {
	CreateWorkloadIntent(wi WorkloadIntent, project, compositeapp, compositeappversion, dig, netcontrolintent string, exists bool) (WorkloadIntent, error)
	GetWorkloadIntent(name, project, compositeapp, compositeappversion, dig, netcontrolintent string) (WorkloadIntent, error)
	GetWorkloadIntents(project, compositeapp, compositeappversion, dig, netcontrolintent string) ([]WorkloadIntent, error)
	DeleteWorkloadIntent(name, project, compositeapp, compositeappversion, dig, netcontrolintent string) error
}

// WorkloadIntentClient implements the Manager
// It will also be used to maintain some localized state
type WorkloadIntentClient struct {
	db ClientDbInfo
}

// NewWorkloadIntentClient returns an instance of the WorkloadIntentClient
// which implements the Manager
func NewWorkloadIntentClient() *WorkloadIntentClient {
	return &WorkloadIntentClient{
		db: ClientDbInfo{
			storeName: "orchestrator",
			tagMeta:   "workloadintentmetadata",
		},
	}
}

// CreateWorkloadIntent - create a new WorkloadIntent
func (v *WorkloadIntentClient) CreateWorkloadIntent(wi WorkloadIntent, project, compositeapp, compositeappversion, dig, netcontrolintent string, exists bool) (WorkloadIntent, error) {

	//Construct key and tag to select the entry
	key := WorkloadIntentKey{
		Project:             project,
		CompositeApp:        compositeapp,
		CompositeAppVersion: compositeappversion,
		DigName:             dig,
		NetControlIntent:    netcontrolintent,
		WorkloadIntent:      wi.Metadata.Name,
	}

	//Check if the Network Control Intent exists
	_, err := NewNetControlIntentClient().GetNetControlIntent(netcontrolintent, project, compositeapp, compositeappversion, dig)
	if err != nil {
		return WorkloadIntent{}, pkgerrors.Errorf("Network Control Intent %v does not exist", netcontrolintent)
	}

	//Check if this WorkloadIntent already exists
	_, err = v.GetWorkloadIntent(wi.Metadata.Name, project, compositeapp, compositeappversion, dig, netcontrolintent)
	if err == nil && !exists {
		return WorkloadIntent{}, pkgerrors.New("WorkloadIntent already exists")
	}

	err = db.DBconn.Insert(v.db.storeName, key, nil, v.db.tagMeta, wi)
	if err != nil {
		return WorkloadIntent{}, pkgerrors.Wrap(err, "Creating DB Entry")
	}

	return wi, nil
}

// GetWorkloadIntent returns the WorkloadIntent for corresponding name
func (v *WorkloadIntentClient) GetWorkloadIntent(name, project, compositeapp, compositeappversion, dig, netcontrolintent string) (WorkloadIntent, error) {

	//Construct key and tag to select the entry
	key := WorkloadIntentKey{
		Project:             project,
		CompositeApp:        compositeapp,
		CompositeAppVersion: compositeappversion,
		DigName:             dig,
		NetControlIntent:    netcontrolintent,
		WorkloadIntent:      name,
	}

	value, err := db.DBconn.Find(v.db.storeName, key, v.db.tagMeta)
	if err != nil {
		return WorkloadIntent{}, pkgerrors.Wrap(err, "db Find error")
	}

	//value is a byte array
	if value != nil {
		wi := WorkloadIntent{}
		err = db.DBconn.Unmarshal(value[0], &wi)
		if err != nil {
			return WorkloadIntent{}, pkgerrors.Wrap(err, "Unmarshalling Value")
		}
		return wi, nil
	}

	return WorkloadIntent{}, pkgerrors.New("Error getting WorkloadIntent")
}

// GetWorkloadIntentList returns all of the WorkloadIntent for corresponding name
func (v *WorkloadIntentClient) GetWorkloadIntents(project, compositeapp, compositeappversion, dig, netcontrolintent string) ([]WorkloadIntent, error) {

	//Construct key and tag to select the entry
	key := WorkloadIntentKey{
		Project:             project,
		CompositeApp:        compositeapp,
		CompositeAppVersion: compositeappversion,
		DigName:             dig,
		NetControlIntent:    netcontrolintent,
		WorkloadIntent:      "",
	}

	var resp []WorkloadIntent
	values, err := db.DBconn.Find(v.db.storeName, key, v.db.tagMeta)
	if err != nil {
		return []WorkloadIntent{}, pkgerrors.Wrap(err, "db Find error")
	}

	for _, value := range values {
		wi := WorkloadIntent{}
		err = db.DBconn.Unmarshal(value, &wi)
		if err != nil {
			return []WorkloadIntent{}, pkgerrors.Wrap(err, "Unmarshalling Value")
		}
		resp = append(resp, wi)
	}

	return resp, nil
}

// Delete the  WorkloadIntent from database
func (v *WorkloadIntentClient) DeleteWorkloadIntent(name, project, compositeapp, compositeappversion, dig, netcontrolintent string) error {

	//Construct key and tag to select the entry
	key := WorkloadIntentKey{
		Project:             project,
		CompositeApp:        compositeapp,
		CompositeAppVersion: compositeappversion,
		DigName:             dig,
		NetControlIntent:    netcontrolintent,
		WorkloadIntent:      name,
	}

	err := db.DBconn.Remove(v.db.storeName, key)
	if err != nil {
		if strings.Contains(err.Error(), "Error finding:") {
			return pkgerrors.Wrap(err, "db Remove error - not found")
		} else if strings.Contains(err.Error(), "Can't delete parent without deleting child") {
			return pkgerrors.Wrap(err, "db Remove error - conflict")
		} else {
			return pkgerrors.Wrap(err, "db Remove error - general")
		}
	}

	return nil
}

// Delete the  NetControlIntent from database
func (v *NetControlIntentClient) DeleteNetControlIntent(name, project, compositeapp, compositeappversion, dig string) error {

	//Construct key and tag to select the entry
	key := NetControlIntentKey{
		NetControlIntent:    name,
		Project:             project,
		CompositeApp:        compositeapp,
		CompositeAppVersion: compositeappversion,
		DigName:             dig,
	}

	err := db.DBconn.Remove(v.db.storeName, key)
	if err != nil {
		if strings.Contains(err.Error(), "Error finding:") {
			return pkgerrors.Wrap(err, "db Remove error - not found")
		} else if strings.Contains(err.Error(), "Can't delete parent without deleting child") {
			return pkgerrors.Wrap(err, "db Remove error - conflict")
		} else {
			return pkgerrors.Wrap(err, "db Remove error - general")
		}
	}

	return nil
}

// WorkloadIfIntent contains the parameters needed for dynamic networks
type WorkloadIfIntent struct {
	Metadata Metadata             `json:"metadata"`
	Spec     WorkloadIfIntentSpec `json:"spec"`
}

type WorkloadIfIntentSpec struct {
	IfName         string `json:"interface"`
	NetworkName    string `json:"name"`
	DefaultGateway string `json:"defaultGateway"`       // optional, default value is "false"
	IpAddr         string `json:"ipAddress,omitempty"`  // optional, if not provided then will be dynamically allocated
	MacAddr        string `json:"macAddress,omitempty"` // optional, if not provided then will be dynamically allocated
}

// WorkloadIfIntentKey is the key structure that is used in the database
type WorkloadIfIntentKey struct {
	Project             string `json:"provider"`
	CompositeApp        string `json:"compositeapp"`
	CompositeAppVersion string `json:"compositeappversion"`
	DigName             string `json:"deploymentintentgroup"`
	NetControlIntent    string `json:"netcontrolintent"`
	WorkloadIntent      string `json:"workloadintent"`
	WorkloadIfIntent    string `json:"workloadifintent"`
}

// Manager is an interface exposing the WorkloadIfIntent functionality
type WorkloadIfIntentManager interface {
	CreateWorkloadIfIntent(wi WorkloadIfIntent, project, compositeapp, compositeappversion, dig, netcontrolintent, workloadintent string, exists bool) (WorkloadIfIntent, error)
	GetWorkloadIfIntent(name, project, compositeapp, compositeappversion, dig, netcontrolintent, workloadintent string) (WorkloadIfIntent, error)
	GetWorkloadIfIntents(project, compositeapp, compositeappversion, dig, netcontrolintent, workloadintent string) ([]WorkloadIfIntent, error)
	DeleteWorkloadIfIntent(name, project, compositeapp, compositeappversion, dig, netcontrolintent, workloadintent string) error
}

// WorkloadIfIntentClient implements the Manager
// It will also be used to maintain some localized state
type WorkloadIfIntentClient struct {
	db ClientDbInfo
}

// NewWorkloadIfIntentClient returns an instance of the WorkloadIfIntentClient
// which implements the Manager
func NewWorkloadIfIntentClient() *WorkloadIfIntentClient {
	return &WorkloadIfIntentClient{
		db: ClientDbInfo{
			storeName: "orchestrator",
			tagMeta:   "workloadifintentmetadata",
		},
	}
}

// CreateWorkloadIfIntent - create a new WorkloadIfIntent
func (v *WorkloadIfIntentClient) CreateWorkloadIfIntent(wif WorkloadIfIntent, project, compositeapp, compositeappversion, dig, netcontrolintent, workloadintent string, exists bool) (WorkloadIfIntent, error) {

	//Construct key and tag to select the entry
	key := WorkloadIfIntentKey{
		Project:             project,
		CompositeApp:        compositeapp,
		CompositeAppVersion: compositeappversion,
		DigName:             dig,
		NetControlIntent:    netcontrolintent,
		WorkloadIntent:      workloadintent,
		WorkloadIfIntent:    wif.Metadata.Name,
	}

	//Check if the Workload Intent exists
	_, err := NewWorkloadIntentClient().GetWorkloadIntent(workloadintent, project, compositeapp, compositeappversion, dig, netcontrolintent)
	if err != nil {
		return WorkloadIfIntent{}, pkgerrors.Errorf("Workload Intent %v does not exist", workloadintent)
	}

	//Check if this WorkloadIfIntent already exists
	_, err = v.GetWorkloadIfIntent(wif.Metadata.Name, project, compositeapp, compositeappversion, dig, netcontrolintent, workloadintent)
	if err == nil && !exists {
		return WorkloadIfIntent{}, pkgerrors.New("WorkloadIfIntent already exists")
	}

	err = db.DBconn.Insert(v.db.storeName, key, nil, v.db.tagMeta, wif)
	if err != nil {
		return WorkloadIfIntent{}, pkgerrors.Wrap(err, "Creating DB Entry")
	}

	return wif, nil
}

// GetWorkloadIfIntent returns the WorkloadIfIntent for corresponding name
func (v *WorkloadIfIntentClient) GetWorkloadIfIntent(name, project, compositeapp, compositeappversion, dig, netcontrolintent, workloadintent string) (WorkloadIfIntent, error) {

	//Construct key and tag to select the entry
	key := WorkloadIfIntentKey{
		Project:             project,
		CompositeApp:        compositeapp,
		CompositeAppVersion: compositeappversion,
		DigName:             dig,
		NetControlIntent:    netcontrolintent,
		WorkloadIntent:      workloadintent,
		WorkloadIfIntent:    name,
	}

	value, err := db.DBconn.Find(v.db.storeName, key, v.db.tagMeta)
	if err != nil {
		return WorkloadIfIntent{}, pkgerrors.Wrap(err, "db Find error")
	}

	//value is a byte array
	if value != nil {
		wif := WorkloadIfIntent{}
		err = db.DBconn.Unmarshal(value[0], &wif)
		if err != nil {
			return WorkloadIfIntent{}, pkgerrors.Wrap(err, "Unmarshalling Value")
		}
		return wif, nil
	}

	return WorkloadIfIntent{}, pkgerrors.New("Error getting WorkloadIfIntent")
}

// GetWorkloadIfIntentList returns all of the WorkloadIfIntent for corresponding name
func (v *WorkloadIfIntentClient) GetWorkloadIfIntents(project, compositeapp, compositeappversion, dig, netcontrolintent, workloadintent string) ([]WorkloadIfIntent, error) {

	//Construct key and tag to select the entry
	key := WorkloadIfIntentKey{
		Project:             project,
		CompositeApp:        compositeapp,
		CompositeAppVersion: compositeappversion,
		DigName:             dig,
		NetControlIntent:    netcontrolintent,
		WorkloadIntent:      workloadintent,
		WorkloadIfIntent:    "",
	}

	var resp []WorkloadIfIntent
	values, err := db.DBconn.Find(v.db.storeName, key, v.db.tagMeta)
	if err != nil {
		return []WorkloadIfIntent{}, pkgerrors.Wrap(err, "db Find error")
	}

	for _, value := range values {
		wif := WorkloadIfIntent{}
		err = db.DBconn.Unmarshal(value, &wif)
		if err != nil {
			return []WorkloadIfIntent{}, pkgerrors.Wrap(err, "Unmarshalling Value")
		}
		resp = append(resp, wif)
	}

	return resp, nil
}

// Delete the  WorkloadIfIntent from database
func (v *WorkloadIfIntentClient) DeleteWorkloadIfIntent(name, project, compositeapp, compositeappversion, dig, netcontrolintent, workloadintent string) error {

	//Construct key and tag to select the entry
	key := WorkloadIfIntentKey{
		Project:             project,
		CompositeApp:        compositeapp,
		CompositeAppVersion: compositeappversion,
		DigName:             dig,
		NetControlIntent:    netcontrolintent,
		WorkloadIntent:      workloadintent,
		WorkloadIfIntent:    name,
	}

	err := db.DBconn.Remove(v.db.storeName, key)
	if err != nil {
		if strings.Contains(err.Error(), "Error finding:") {
			return pkgerrors.Wrap(err, "db Remove error - not found")
		} else if strings.Contains(err.Error(), "Can't delete parent without deleting child") {
			return pkgerrors.Wrap(err, "db Remove error - conflict")
		} else {
			return pkgerrors.Wrap(err, "db Remove error - general")
		}
	}

	return nil
}
