package localstore

/*
 This files store/retrieves the application intents data in
 middleend db, in the same format as it is stored in EMCO.
*/

import (
	"encoding/json"
	//"reflect"
	"strings"

	"example.com/middleend/db"
	pkgerrors "github.com/pkg/errors"
)

// GenericPlacementIntent shall have 2 fields - metadata and spec
type GenericPlacementIntent struct {
	MetaData GenIntentMetaData `json:"metadata"`
}

// GenIntentMetaData has name, description, userdata1, userdata2
type GenIntentMetaData struct {
	Name        string `json:"name"`
	Description string `json:"description"`
	UserData1   string `json:"userData1"`
	UserData2   string `json:"userData2"`
}

// GenericPlacementIntentManager is an interface which exposes the GenericPlacementIntentManager functionality
type GenericPlacementIntentManager interface {
	CreateGenericPlacementIntent(g GenericPlacementIntent, p string, ca string,
		v string, digName string) (GenericPlacementIntent, error)
	GetGenericPlacementIntent(intentName string, projectName string,
		compositeAppName string, version string, digName string) (GenericPlacementIntent, error)
	DeleteGenericPlacementIntent(intentName string, projectName string,
		compositeAppName string, version string, digName string) error

	GetAllGenericPlacementIntents(p string, ca string, v string, digName string) ([]GenericPlacementIntent, error)
}

// GenericPlacementIntentKey is used as the primary key
type GenericPlacementIntentKey struct {
	Name         string `json:"genericplacement"`
	Project      string `json:"project"`
	CompositeApp string `json:"compositeapp"`
	Version      string `json:"compositeappversion"`
	DigName      string `json:"deploymentintentgroup"`
}

// AppIntent has two components - metadata, spec
type AppIntent struct {
	MetaData MetaData `json:"metadata"`
	Spec     SpecData `json:"spec"`
}

// MetaData has - name, description, userdata1, userdata2
type MetaData struct {
	Name        string `json:"name"`
	Description string `json:"description"`
	UserData1   string `json:"userData1"`
	UserData2   string `json:"userData2"`
}

// SpecData consists of appName and intent
type SpecData struct {
	AppName string      `json:"app-name"`
	Intent  IntentStruc `json:"intent"`
}

// ClusterList consists of mandatoryClusters and OptionalClusters
type ClusterList struct {
	MandatoryClusters []ClusterGroup
	OptionalClusters  []ClusterGroup
}

//ClusterGroup consists of Clusters and GroupNumber. All the clusters under the same clusterGroup belong to the same groupNumber
type ClusterGroup struct {
	Clusters    []ClusterWithName
	GroupNumber string
}

// ClusterWithName has two fields - ProviderName and ClusterName
type ClusterWithName struct {
	ProviderName string
	ClusterName  string
}

// ClusterWithLabel has two fields - ProviderName and ClusterLabel
type ClusterWithLabel struct {
	ProviderName string
	ClusterLabel string
}

// IntentStruc consists of AllOfArray and AnyOfArray
type IntentStruc struct {
	AllOfArray []AllOf `json:"allOf,omitempty"`
	AnyOfArray []AnyOf `json:"anyOf,omitempty"`
}

// AllOf consists if ProviderName, ClusterName, ClusterLabelName and AnyOfArray. Any of them can be empty
type AllOf struct {
	ProviderName     string  `json:"provider-name,omitempty"`
	ClusterName      string  `json:"cluster-name,omitempty"`
	ClusterLabelName string  `json:"cluster-label-name,omitempty"`
	AnyOfArray       []AnyOf `json:"anyOf,omitempty"`
}

// AnyOf consists of Array of ProviderName & ClusterLabelNames
type AnyOf struct {
	ProviderName     string `json:"provider-name,omitempty"`
	ClusterName      string `json:"cluster-name,omitempty"`
	ClusterLabelName string `json:"cluster-label-name,omitempty"`
}

// AppIntentManager is an interface which exposes the
// AppIntentManager functionalities
type AppIntentManager interface {
	CreateAppIntent(a AppIntent, p string, ca string, v string, i string, digName string) (AppIntent, error)
	GetAppIntent(ai string, p string, ca string, v string, i string, digName string) (AppIntent, error)
	GetAllIntentsByApp(aN, p, ca, v, i, digName string) (SpecData, error)
	GetAllAppIntents(p, ca, v, i, digName string) ([]AppIntent, error)
	DeleteAppIntent(ai string, p string, ca string, v string, i string, digName string) error
}

//AppIntentQueryKey required for query
type AppIntentQueryKey struct {
	AppName string `json:"app-name"`
}

// AppIntentKey is used as primary key
type AppIntentKey struct {
	Name                      string `json:"appintent"`
	Project                   string `json:"project"`
	CompositeApp              string `json:"compositeapp"`
	Version                   string `json:"compositeappversion"`
	Intent                    string `json:"genericplacement"`
	DeploymentIntentGroupName string `json:"deploymentintentgroup"`
}

// AppIntentFindByAppKey required for query
type AppIntentFindByAppKey struct {
	Project                   string `json:"project"`
	CompositeApp              string `json:"compositeapp"`
	CompositeAppVersion       string `json:"compositeappversion"`
	Intent                    string `json:"genericplacement"`
	DeploymentIntentGroupName string `json:"deploymentintentgroup"`
	AppName                   string `json:"app-name"`
}

// ApplicationsAndClusterInfo type represents the list of
type ApplicationsAndClusterInfo struct {
	ArrayOfAppClusterInfo []AppClusterInfo `json:"applications"`
}

// AppClusterInfo is a type linking the app and the clusters
// on which they need to be installed.
type AppClusterInfo struct {
	Name       string  `json:"name"`
	AllOfArray []AllOf `json:"allOf,omitempty"`
	AnyOfArray []AnyOf `json:"anyOf,omitempty"`
}

// We will use json marshalling to convert to string to
// preserve the underlying structure.
func (ak AppIntentKey) String() string {
	out, err := json.Marshal(ak)
	if err != nil {
		return ""
	}
	return string(out)
}

// AppIntentClient implements the AppIntentManager interface
type AppIntentClient struct {
	storeName   string
	tagMetaData string
}

// NewAppIntentClient returns an instance of AppIntentClient
func NewAppIntentClient() *AppIntentClient {
	return &AppIntentClient{
		storeName:   "orchestrator",
		tagMetaData: "appintentmetadata",
	}
}

// CreateAppIntent creates an entry for AppIntent in the db.
// Other input parameters for it - projectName, compositeAppName, version, intentName and deploymentIntentGroupName.
func (c *AppIntentClient) CreateAppIntent(a AppIntent, p string, ca string, v string, i string, digName string) (AppIntent, error) {

	//Check for the AppIntent already exists here.
	/*
		res, err := c.GetAppIntent(a.MetaData.Name, p, ca, v, i, digName)
		if !reflect.DeepEqual(res, AppIntent{}) {
			return AppIntent{}, pkgerrors.New("AppIntent already exists")
		}

			//Check if project exists
			_, err = NewProjectClient().GetProject(p)
			if err != nil {
				return AppIntent{}, pkgerrors.New("Unable to find the project")
			}

				// check if compositeApp exists
				_, err = NewCompositeAppClient().GetCompositeApp(ca, v, p)
				if err != nil {
					return AppIntent{}, pkgerrors.New("Unable to find the composite-app")
				}

				// check if Intent exists
				_, err = NewGenericPlacementIntentClient().GetGenericPlacementIntent(i, p, ca, v, digName)
				if err != nil {
					return AppIntent{}, pkgerrors.New("Unable to find the intent")
				}

				// check if the deploymentIntentGrpName exists
				_, err = NewDeploymentIntentGroupClient().GetDeploymentIntentGroup(digName, p, ca, v)
				if err != nil {
					return AppIntent{}, pkgerrors.New("Unable to find the deployment-intent-group-name")
				}
	*/

	akey := AppIntentKey{
		Name:                      a.MetaData.Name,
		Project:                   p,
		CompositeApp:              ca,
		Version:                   v,
		Intent:                    i,
		DeploymentIntentGroupName: digName,
	}

	qkey := AppIntentQueryKey{
		AppName: a.Spec.AppName,
	}

	err := db.DBconn.Insert(c.storeName, akey, qkey, c.tagMetaData, a)
	if err != nil {
		return AppIntent{}, pkgerrors.Wrap(err, "Create DB entry error")
	}

	return a, nil
}

// GetAppIntent shall take arguments - name of the app intent, name of the project, name of the composite app, version of the composite app,intent name and deploymentIntentGroupName. It shall return the AppIntent
func (c *AppIntentClient) GetAppIntent(ai string, p string, ca string, v string, i string, digName string) (AppIntent, error) {

	k := AppIntentKey{
		Name:                      ai,
		Project:                   p,
		CompositeApp:              ca,
		Version:                   v,
		Intent:                    i,
		DeploymentIntentGroupName: digName,
	}

	result, err := db.DBconn.Find(c.storeName, k, c.tagMetaData)
	if err != nil {
		return AppIntent{}, pkgerrors.Wrap(err, "db Find error")
	}

	if result != nil {
		a := AppIntent{}
		err = db.DBconn.Unmarshal(result[0], &a)
		if err != nil {
			return AppIntent{}, pkgerrors.Wrap(err, "Unmarshalling  AppIntent")
		}
		return a, nil

	}
	return AppIntent{}, pkgerrors.New("Error getting AppIntent")
}

/*
GetAllIntentsByApp queries intent by AppName, it takes in parameters AppName, CompositeAppName, CompositeNameVersion,
GenericPlacementIntentName & DeploymentIntentGroupName. Returns SpecData which contains
all the intents for the app.
*/
func (c *AppIntentClient) GetAllIntentsByApp(aN, p, ca, v, i, digName string) (SpecData, error) {
	k := AppIntentFindByAppKey{
		Project:                   p,
		CompositeApp:              ca,
		CompositeAppVersion:       v,
		Intent:                    i,
		DeploymentIntentGroupName: digName,
		AppName:                   aN,
	}
	result, err := db.DBconn.Find(c.storeName, k, c.tagMetaData)
	if err != nil {
		return SpecData{}, pkgerrors.Wrap(err, "db Find error")
	}
	if len(result) == 0 {
		return SpecData{}, nil
	}

	var a AppIntent
	err = db.DBconn.Unmarshal(result[0], &a)
	if err != nil {
		return SpecData{}, pkgerrors.Wrap(err, "Unmarshalling  AppIntent")
	}
	return a.Spec, nil

}

/*
GetAllAppIntents takes in paramaters ProjectName, CompositeAppName, CompositeNameVersion
and GenericPlacementIntentName,DeploymentIntentGroupName. Returns an array of AppIntents
*/
func (c *AppIntentClient) GetAllAppIntents(p, ca, v, i, digName string) ([]AppIntent, error) {
	k := AppIntentKey{
		Name:                      "",
		Project:                   p,
		CompositeApp:              ca,
		Version:                   v,
		Intent:                    i,
		DeploymentIntentGroupName: digName,
	}
	result, err := db.DBconn.Find(c.storeName, k, c.tagMetaData)
	if err != nil {
		return []AppIntent{}, pkgerrors.Wrap(err, "db Find error")
	}

	var appIntents []AppIntent

	if len(result) != 0 {
		for i := range result {
			aI := AppIntent{}
			err = db.DBconn.Unmarshal(result[i], &aI)
			if err != nil {
				return []AppIntent{}, pkgerrors.Wrap(err, "Unmarshalling  AppIntent")
			}
			appIntents = append(appIntents, aI)
		}
	}

	return appIntents, err
}

// DeleteAppIntent delete an AppIntent
func (c *AppIntentClient) DeleteAppIntent(ai string, p string, ca string, v string, i string, digName string) error {
	k := AppIntentKey{
		Name:                      ai,
		Project:                   p,
		CompositeApp:              ca,
		Version:                   v,
		Intent:                    i,
		DeploymentIntentGroupName: digName,
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

// We will use json marshalling to convert to string to
// preserve the underlying structure.
func (gk GenericPlacementIntentKey) String() string {
	out, err := json.Marshal(gk)
	if err != nil {
		return ""
	}
	return string(out)
}

// GenericPlacementIntentClient implements the GenericPlacementIntentManager interface
type GenericPlacementIntentClient struct {
	storeName   string
	tagMetaData string
}

// NewGenericPlacementIntentClient return an instance of GenericPlacementIntentClient which implements GenericPlacementIntentManager
func NewGenericPlacementIntentClient() *GenericPlacementIntentClient {
	return &GenericPlacementIntentClient{
		storeName:   "orchestrator",
		tagMetaData: "genericplacementintentmetadata",
	}
}

// CreateGenericPlacementIntent creates an entry for GenericPlacementIntent in the database. Other Input parameters for it - projectName, compositeAppName, version and deploymentIntentGroupName
func (c *GenericPlacementIntentClient) CreateGenericPlacementIntent(g GenericPlacementIntent, p string, ca string,
	v string, digName string) (GenericPlacementIntent, error) {

	/*
		// check if the genericPlacement already exists.
		res, err := c.GetGenericPlacementIntent(g.MetaData.Name, p, ca, v, digName)
		if res != (GenericPlacementIntent{}) {
			return GenericPlacementIntent{}, pkgerrors.New("Intent already exists")
		}

		//Check if project exists
		_, err = NewProjectClient().GetProject(p)
		if err != nil {
			return GenericPlacementIntent{}, pkgerrors.New("Unable to find the project")
		}

		// check if compositeApp exists
		_, err = NewCompositeAppClient().GetCompositeApp(ca, v, p)
		if err != nil {
			return GenericPlacementIntent{}, pkgerrors.New("Unable to find the composite-app")
		}

		// check if the deploymentIntentGrpName exists
		_, err = NewDeploymentIntentGroupClient().GetDeploymentIntentGroup(digName, p, ca, v)
		if err != nil {
			return GenericPlacementIntent{}, pkgerrors.New("Unable to find the deployment-intent-group-name")
		}
	*/

	gkey := GenericPlacementIntentKey{
		Name:         g.MetaData.Name,
		Project:      p,
		CompositeApp: ca,
		Version:      v,
		DigName:      digName,
	}

	err := db.DBconn.Insert(c.storeName, gkey, nil, c.tagMetaData, g)
	if err != nil {
		return GenericPlacementIntent{}, pkgerrors.Wrap(err, "Create DB entry error")
	}

	return g, nil
}

// GetGenericPlacementIntent shall take arguments - name of the intent, name of the project, name of the composite app, version of the composite app and deploymentIntentGroupName. It shall return the genericPlacementIntent if its present.
func (c *GenericPlacementIntentClient) GetGenericPlacementIntent(i string, p string, ca string, v string, digName string) (GenericPlacementIntent, error) {
	key := GenericPlacementIntentKey{
		Name:         i,
		Project:      p,
		CompositeApp: ca,
		Version:      v,
		DigName:      digName,
	}

	result, err := db.DBconn.Find(c.storeName, key, c.tagMetaData)
	if err != nil {
		return GenericPlacementIntent{}, pkgerrors.Wrap(err, "db Find error")
	}

	if result != nil {
		g := GenericPlacementIntent{}
		err = db.DBconn.Unmarshal(result[0], &g)
		if err != nil {
			return GenericPlacementIntent{}, pkgerrors.Wrap(err, "Unmarshalling GenericPlacement Intent")
		}
		return g, nil
	}

	return GenericPlacementIntent{}, pkgerrors.New("Error getting GenericPlacementIntent")

}

// GetAllGenericPlacementIntents returns all the generic placement intents for a given compsoite app name, composite app version, project and deploymentIntentGroupName
func (c *GenericPlacementIntentClient) GetAllGenericPlacementIntents(p string, ca string, v string, digName string) ([]GenericPlacementIntent, error) {

	/*
		//Check if project exists
		_, err := NewProjectClient().GetProject(p)
		if err != nil {
			return []GenericPlacementIntent{}, err
		}

		// check if compositeApp exists
		_, err = NewCompositeAppClient().GetCompositeApp(ca, v, p)
		if err != nil {
			return []GenericPlacementIntent{}, pkgerrors.Wrap(err, "Unable to find the composite-app, check compositeApp name and version")
		}
	*/

	key := GenericPlacementIntentKey{
		Name:         "",
		Project:      p,
		CompositeApp: ca,
		Version:      v,
		DigName:      digName,
	}

	var gpList []GenericPlacementIntent
	values, err := db.DBconn.Find(c.storeName, key, c.tagMetaData)
	if err != nil {
		return []GenericPlacementIntent{}, pkgerrors.Wrap(err, "db Find error")
	}

	for _, value := range values {
		gp := GenericPlacementIntent{}
		err = db.DBconn.Unmarshal(value, &gp)
		if err != nil {
			return []GenericPlacementIntent{}, pkgerrors.Wrap(err, "Unmarshaling GenericPlacementIntent")
		}
		gpList = append(gpList, gp)
	}

	return gpList, nil

}

// DeleteGenericPlacementIntent the intent from the database
func (c *GenericPlacementIntentClient) DeleteGenericPlacementIntent(i string, p string, ca string, v string, digName string) error {
	key := GenericPlacementIntentKey{
		Name:         i,
		Project:      p,
		CompositeApp: ca,
		Version:      v,
		DigName:      digName,
	}

	err := db.DBconn.Remove(c.storeName, key)
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
