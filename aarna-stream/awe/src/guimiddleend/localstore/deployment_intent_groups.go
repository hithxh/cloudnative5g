package localstore

import (
	"encoding/json"
	"reflect"
	"strings"
	"time"

	"example.com/middleend/db"

	//	"github.com/open-ness/EMCO/src/orchestrator/pkg/state"
	pkgerrors "github.com/pkg/errors"
	log "github.com/sirupsen/logrus"
)

// StateInfo struct is used to maintain the values for state, contextid, (and other)
// information about resources which can be instantiated via rsync.
// The last Actions entry holds the current state of the container object.
type StateInfo struct {
	Actions []ActionEntry `json:"actions"`
}

// ActionEntry is used to keep track of the time an action (e.g. Created, Instantiate, Terminate) was invoked
// For actions where an AppContext is relevent, the ContextId field will be non-zero length
type ActionEntry struct {
	State     StateValue `json:"state"`
	ContextId string     `json:"instance"`
	TimeStamp time.Time  `json:"time"`
}

type StateValue = string

type states struct {
	Undefined          StateValue
	Created            StateValue
	Approved           StateValue
	Applied            StateValue
	Instantiated       StateValue
	Terminated         StateValue
	InstantiateStopped StateValue
	TerminateStopped   StateValue
	Updated            StateValue
}

var StateEnum = &states{
	Undefined:          "Undefined",
	Created:            "Created",
	Approved:           "Approved",
	Applied:            "Applied",
	Instantiated:       "Instantiated",
	Terminated:         "Terminated",
	InstantiateStopped: "InstantiateStopped",
	TerminateStopped:   "TerminateStopped",
	Updated:            "Updated",
}

// DeploymentIntentGroup shall have 2 fields - MetaData and Spec
type DeploymentIntentGroup struct {
	MetaData DepMetaData `json:"metadata"`
	Spec     DepSpecData `json:"spec"`
}

// DepMetaData has Name, description, userdata1, userdata2
type DepMetaData struct {
	Name        string `json:"name"`
	Description string `json:"description"`
	UserData1   string `json:"userData1"`
	UserData2   string `json:"userData2"`
}

// DepSpecData has profile, version, OverrideValuesObj
type DepSpecData struct {
	Profile           string           `json:"profile"`
	Version           string           `json:"version"`
	OverrideValuesObj []OverrideValues `json:"override-values"`
	LogicalCloud      string           `json:"logical-cloud"`
	Status string `json:"status, omitempty"`
	IsCheckedOut bool `json:"is_checked_out"`
}

// OverrideValues has appName and ValuesObj
type OverrideValues struct {
	AppName   string            `json:"app-name"`
	ValuesObj map[string]string `json:"values"`
}

// MigrateJson contains metadata and spec for migrate API
type MigrateJson struct {
	MetaData UpdateMetadata `json:"metadata,omitempty"`
	Spec     MigrateSpec    `json:"spec"`
}

// RollbackJson contains metadata and spec for rollback API
type RollbackJson struct {
	MetaData UpdateMetadata `json:"metadata,omitempty"`
	Spec     RollbackSpec   `json:"spec"`
}

type UpdateMetadata struct {
	Description string `json:"description"`
}

type MigrateSpec struct {
	TargetCompositeAppVersion string `json:"target-composite-app-version"`
	TargetDigName             string `json:"target-dig-name"`
}

type RollbackSpec struct {
	Revison string `json:"revision"`
}

// Values has ImageRepository
// type Values struct {
// 	ImageRepository string `json:"imageRepository"`
// }

// DeploymentIntentGroupManager is an interface which exposes the DeploymentIntentGroupManager functionality
type DeploymentIntentGroupManager interface {
	CreateDeploymentIntentGroup(d DeploymentIntentGroup, p string, ca string, v string) (DeploymentIntentGroup, error)
	GetDeploymentIntentGroup(di string, p string, ca string, v string) (DeploymentIntentGroup, error)
	//GetDeploymentIntentGroupState(di string, p string, ca string, v string) (state.StateInfo, error)
	DeleteDeploymentIntentGroup(di string, p string, ca string, v string) error
	GetAllDeploymentIntentGroups(p string, ca string, v string) ([]DeploymentIntentGroup, error)
}

// DeploymentIntentGroupKey consists of Name of the deployment group, project name, CompositeApp name, CompositeApp version
type DeploymentIntentGroupKey struct {
	Name         string `json:"deploymentintentgroup"`
	Project      string `json:"project"`
	CompositeApp string `json:"compositeapp"`
	Version      string `json:"compositeappversion"`
}

// We will use json marshalling to convert to string to
// preserve the underlying structure.
func (dk DeploymentIntentGroupKey) String() string {
	out, err := json.Marshal(dk)
	if err != nil {
		return ""
	}
	return string(out)
}

// DeploymentIntentGroupClient implements the DeploymentIntentGroupManager interface
type DeploymentIntentGroupClient struct {
	storeName   string
	tagMetaData string
	tagState    string
}

// NewDeploymentIntentGroupClient return an instance of DeploymentIntentGroupClient which implements DeploymentIntentGroupManager
func NewDeploymentIntentGroupClient() *DeploymentIntentGroupClient {
	return &DeploymentIntentGroupClient{
		storeName:   "orchestrator",
		tagMetaData: "deploymentintentgroupmetadata",
		tagState:    "stateInfo",
	}
}

// CreateDeploymentIntentGroup creates an entry for a given  DeploymentIntentGroup in the database. Other Input parameters for it - projectName, compositeAppName, version
func (c *DeploymentIntentGroupClient) CreateDeploymentIntentGroup(d DeploymentIntentGroup, p string, ca string,
	v string) (DeploymentIntentGroup, error) {

	/*
		res, err := c.GetDeploymentIntentGroup(d.MetaData.Name, p, ca, v)
		if !reflect.DeepEqual(res, DeploymentIntentGroup{}) {
			return DeploymentIntentGroup{}, pkgerrors.New("DeploymentIntent already exists")
		}

			//Check if project exists
			_, err = NewProjectClient().GetProject(p)
			if err != nil {
				return DeploymentIntentGroup{}, pkgerrors.New("Unable to find the project")
			}

			//check if compositeApp exists
			_, err = NewCompositeAppClient().GetCompositeApp(ca, v, p)
			if err != nil {
				return DeploymentIntentGroup{}, pkgerrors.New("Unable to find the composite-app")
			}
	*/

	gkey := DeploymentIntentGroupKey{
		Name:         d.MetaData.Name,
		Project:      p,
		CompositeApp: ca,
		Version:      v,
	}

	err := db.DBconn.Insert(c.storeName, gkey, nil, c.tagMetaData, d)
	if err != nil {
		return DeploymentIntentGroup{}, pkgerrors.Wrap(err, "Create DB entry error")
	}

	// Add the stateInfo record
	s := StateInfo{}
	a := ActionEntry{
		State:     StateEnum.Created,
		ContextId: "",
		TimeStamp: time.Now(),
	}
	s.Actions = append(s.Actions, a)

	err = db.DBconn.Insert(c.storeName, gkey, nil, c.tagState, s)
	if err != nil {
		return DeploymentIntentGroup{}, pkgerrors.Wrap(err, "Error updating the stateInfo of the DeploymentIntentGroup: "+d.MetaData.Name)
	}

	return d, nil
}

// GetDeploymentIntentGroup returns the DeploymentIntentGroup with a given name, project, compositeApp and version of compositeApp
func (c *DeploymentIntentGroupClient) GetDeploymentIntentGroup(di string, p string, ca string, v string) (DeploymentIntentGroup, error) {

	key := DeploymentIntentGroupKey{
		Name:         di,
		Project:      p,
		CompositeApp: ca,
		Version:      v,
	}

	log.Infof("GetDeploymentIntentGroup DB key %s", key)
	result, err := db.DBconn.Find(c.storeName, key, c.tagMetaData)
	if err != nil {
		return DeploymentIntentGroup{}, pkgerrors.Wrap(err, "db Find error")
	}

	if result != nil {
		d := DeploymentIntentGroup{}
		err = db.DBconn.Unmarshal(result[0], &d)
		if err != nil {
			return DeploymentIntentGroup{}, pkgerrors.Wrap(err, "Unmarshalling DeploymentIntentGroup")
		}
		return d, nil
	}

	return DeploymentIntentGroup{}, pkgerrors.New("Error getting DeploymentIntentGroup")

}

// GetAllDeploymentIntentGroups returns all the deploymentIntentGroups under a specific project, compositeApp and version
func (c *DeploymentIntentGroupClient) GetAllDeploymentIntentGroups(p string, ca string, v string) ([]DeploymentIntentGroup, error) {

	key := DeploymentIntentGroupKey{
		Name:         "",
		Project:      p,
		CompositeApp: ca,
		Version:      v,
	}

	/*

		//Check if project exists
		_, err := NewProjectClient().GetProject(p)
		if err != nil {
			return []DeploymentIntentGroup{}, pkgerrors.Wrap(err, "Unable to find the project")
		}

		//check if compositeApp exists
		_, err = NewCompositeAppClient().GetCompositeApp(ca, v, p)
		if err != nil {
			return []DeploymentIntentGroup{}, pkgerrors.Wrap(err, "Unable to find the composite-app, check CompositeAppName and Version")
		}
	*/
	log.Infof("GetAllDeploymentIntentGroup DB key %s", key)
	var diList []DeploymentIntentGroup
	result, err := db.DBconn.Find(c.storeName, key, c.tagMetaData)
	if err != nil {
		return []DeploymentIntentGroup{}, pkgerrors.Wrap(err, "db Find error")
	}

	for _, value := range result {
		di := DeploymentIntentGroup{}
		err = db.DBconn.Unmarshal(value, &di)
		if err != nil {
			return []DeploymentIntentGroup{}, pkgerrors.Wrap(err, "Unmarshaling DeploymentIntentGroup")
		}
		diList = append(diList, di)
	}

	return diList, nil

}

// GetDeploymentIntentGroupState returns the AppContent with a given DeploymentIntentname, project, compositeAppName and version of compositeApp
func (c *DeploymentIntentGroupClient) GetDeploymentIntentGroupState(di string, p string, ca string, v string) (StateInfo, error) {

	key := DeploymentIntentGroupKey{
		Name:         di,
		Project:      p,
		CompositeApp: ca,
		Version:      v,
	}

	result, err := db.DBconn.Find(c.storeName, key, c.tagState)
	if err != nil {
		return StateInfo{}, pkgerrors.Wrap(err, "Get DeploymentIntentGroup StateInfo error")
	}

	if result != nil {
		s := StateInfo{}
		err = db.DBconn.Unmarshal(result[0], &s)
		if err != nil {
			return StateInfo{}, pkgerrors.Wrap(err, "Unmarshalling DeploymentIntentGroup StateInfo")
		}
		return s, nil
	}

	return StateInfo{}, pkgerrors.New("Error getting DeploymentIntentGroup StateInfo")
}

// DeleteDeploymentIntentGroup deletes a DeploymentIntentGroup
func (c *DeploymentIntentGroupClient) DeleteDeploymentIntentGroup(di string, p string, ca string, v string) error {
	k := DeploymentIntentGroupKey{
		Name:         di,
		Project:      p,
		CompositeApp: ca,
		Version:      v,
	}

	/*
		s, err := c.GetDeploymentIntentGroupState(di, p, ca, v)
		if err != nil {
			// If the StateInfo cannot be found, then a proper deployment intent group record is not present.
			// Call the DB delete to clean up any errant record without a StateInfo element that may exist.
			err = db.DBconn.Remove(c.storeName, k)
			if err != nil {
				return pkgerrors.Wrap(err, "Error deleting DeploymentIntentGroup entry")
			}
			return nil
		}

			stateVal, err := state.GetCurrentStateFromStateInfo(s)
			if err != nil {
				return pkgerrors.Errorf("Error getting current state from DeploymentIntentGroup stateInfo: " + di)
			}

			if stateVal == state.StateEnum.Instantiated || stateVal == state.StateEnum.InstantiateStopped {
				return pkgerrors.Errorf("DeploymentIntentGroup must be terminated before it can be deleted " + di)
			}

				// remove the app contexts associated with thie Deployment Intent Group
				if stateVal == state.StateEnum.Terminated || stateVal == state.StateEnum.TerminateStopped {
					// Verify that the appcontext has completed terminating
					ctxid := state.GetLastContextIdFromStateInfo(s)
					acStatus, err := state.GetAppContextStatus(ctxid)
					if err == nil &&
						!(acStatus.Status == appcontext.AppContextStatusEnum.Terminated || acStatus.Status == appcontext.AppContextStatusEnum.TerminateFailed) {
						return pkgerrors.Errorf("DeploymentIntentGroup has not completed terminating: " + di)
					}

					for _, id := range state.GetContextIdsFromStateInfo(s) {
						context, err := state.GetAppContextFromId(id)
						if err != nil {
							return pkgerrors.Wrap(err, "Error getting appcontext from Deployment Intent Group StateInfo")
						}
						err = context.DeleteCompositeApp()
						if err != nil {
							return pkgerrors.Wrap(err, "Error deleting appcontext for Deployment Intent Group")
						}
					}
				}
	*/

	err := db.DBconn.Remove(c.storeName, k)
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

// Intent shall have 2 fields - MetaData and Spec
type Intent struct {
	MetaData IntentMetaData `json:"metadata"`
	Spec     IntentSpecData `json:"spec"`
}

// IntentMetaData has Name, Description, userdata1, userdata2
type IntentMetaData struct {
	Name        string `json:"name"`
	Description string `json:"description"`
	UserData1   string `json:"userData1"`
	UserData2   string `json:"userData2"`
}

// IntentSpecData has Intent
type IntentSpecData struct {
	Intent map[string]string `json:"intent"`
}

// ListOfIntents is a list of intents
type ListOfIntents struct {
	ListOfIntents []map[string]string `json:"intent"`
}

// IntentManager is an interface which exposes the IntentManager functionality
type IntentManager interface {
	AddIntent(a Intent, p string, ca string, v string, di string) (Intent, error)
	GetIntent(i string, p string, ca string, v string, di string) (Intent, error)
	GetAllIntents(p, ca, v, di string) (ListOfIntents, error)
	GetIntentByName(i, p, ca, v, di string) (IntentSpecData, error)
	DeleteIntent(i string, p string, ca string, v string, di string) error
}

// IntentKey consists of Name if the intent, Project name, CompositeApp name,
// CompositeApp version
type IntentKey struct {
	Name                  string `json:"intentname"`
	Project               string `json:"project"`
	CompositeApp          string `json:"compositeapp"`
	Version               string `json:"compositeappversion"`
	DeploymentIntentGroup string `json:"deploymentintentgroup"`
}

// We will use json marshalling to convert to string to
// preserve the underlying structure.
func (ik IntentKey) String() string {
	out, err := json.Marshal(ik)
	if err != nil {
		return ""
	}
	return string(out)
}

// IntentClient implements the AddIntentManager interface
type IntentClient struct {
	storeName   string
	tagMetaData string
}

// NewIntentClient returns an instance of AddIntentClient
func NewIntentClient() *IntentClient {
	return &IntentClient{
		storeName:   "orchestrator",
		tagMetaData: "addintent",
	}
}

/*
AddIntent adds a given intent to the deployment-intent-group and stores in the db.
Other input parameters for it - projectName, compositeAppName, version, DeploymentIntentgroupName
*/
func (c *IntentClient) AddIntent(a Intent, p string, ca string, v string, di string) (Intent, error) {

	//Check for the AddIntent already exists here.
	res, err := c.GetIntent(a.MetaData.Name, p, ca, v, di)
	if !reflect.DeepEqual(res, Intent{}) {
		return Intent{}, pkgerrors.New("Intent already exists")
	}
	/*

		//Check if project exists
		_, err = NewProjectClient().GetProject(p)
		if err != nil {
			return Intent{}, pkgerrors.New("Unable to find the project")
		}

		//check if compositeApp exists
		_, err = NewCompositeAppClient().GetCompositeApp(ca, v, p)
		if err != nil {
			return Intent{}, pkgerrors.New("Unable to find the composite-app")
		}

		//check if DeploymentIntentGroup exists
		_, err = NewDeploymentIntentGroupClient().GetDeploymentIntentGroup(di, p, ca, v)
		if err != nil {
			return Intent{}, pkgerrors.New("Unable to find the intent")
		}
	*/

	akey := IntentKey{
		Name:                  a.MetaData.Name,
		Project:               p,
		CompositeApp:          ca,
		Version:               v,
		DeploymentIntentGroup: di,
	}

	err = db.DBconn.Insert(c.storeName, akey, nil, c.tagMetaData, a)
	if err != nil {
		return Intent{}, pkgerrors.Wrap(err, "Create DB entry error")
	}
	return a, nil
}

/*
GetIntent takes in an IntentName, ProjectName, CompositeAppName, Version and DeploymentIntentGroup.
It returns the Intent.
*/
func (c *IntentClient) GetIntent(i string, p string, ca string, v string, di string) (Intent, error) {

	k := IntentKey{
		Name:                  i,
		Project:               p,
		CompositeApp:          ca,
		Version:               v,
		DeploymentIntentGroup: di,
	}

	result, err := db.DBconn.Find(c.storeName, k, c.tagMetaData)
	if err != nil {
		return Intent{}, pkgerrors.Wrap(err, "db Find error")
	}

	if result != nil {
		a := Intent{}
		err = db.DBconn.Unmarshal(result[0], &a)
		if err != nil {
			return Intent{}, pkgerrors.Wrap(err, "Unmarshalling  AppIntent")
		}
		return a, nil

	}
	return Intent{}, pkgerrors.New("Error getting Intent")
}

/*
GetIntentByName takes in IntentName, projectName, CompositeAppName, CompositeAppVersion
and deploymentIntentGroupName returns the list of intents under the IntentName.
*/
func (c IntentClient) GetIntentByName(i string, p string, ca string, v string, di string) (IntentSpecData, error) {
	k := IntentKey{
		Name:                  i,
		Project:               p,
		CompositeApp:          ca,
		Version:               v,
		DeploymentIntentGroup: di,
	}
	result, err := db.DBconn.Find(c.storeName, k, c.tagMetaData)
	if err != nil {
		return IntentSpecData{}, pkgerrors.Wrap(err, "db Find error")
	}
	var a Intent
	err = db.DBconn.Unmarshal(result[0], &a)
	if err != nil {
		return IntentSpecData{}, pkgerrors.Wrap(err, "Unmarshalling  Intent")
	}
	return a.Spec, nil
}

/*
GetAllIntents takes in projectName, CompositeAppName, CompositeAppVersion,
DeploymentIntentName . It returns ListOfIntents.
*/
func (c IntentClient) GetAllIntents(p string, ca string, v string, di string) (ListOfIntents, error) {
	k := IntentKey{
		Name:                  "",
		Project:               p,
		CompositeApp:          ca,
		Version:               v,
		DeploymentIntentGroup: di,
	}

	result, err := db.DBconn.Find(c.storeName, k, c.tagMetaData)
	if err != nil {
		return ListOfIntents{}, pkgerrors.Wrap(err, "db Find error")
	}
	var a Intent
	var listOfMapOfIntents []map[string]string

	if len(result) != 0 {
		for i := range result {
			a = Intent{}
			err = db.DBconn.Unmarshal(result[i], &a)
			if err != nil {
				return ListOfIntents{}, pkgerrors.Wrap(err, "Unmarshalling Intent")
			}
			listOfMapOfIntents = append(listOfMapOfIntents, a.Spec.Intent)
		}
		return ListOfIntents{listOfMapOfIntents}, nil
	}
	return ListOfIntents{}, err
}

// DeleteIntent deletes a given intent tied to project, composite app and deployment intent group
func (c IntentClient) DeleteIntent(i string, p string, ca string, v string, di string) error {
	k := IntentKey{
		Name:                  i,
		Project:               p,
		CompositeApp:          ca,
		Version:               v,
		DeploymentIntentGroup: di,
	}

	err := db.DBconn.Remove(c.storeName, k)
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
