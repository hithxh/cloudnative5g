import React, { useEffect, useState } from "react";
import { makeStyles } from "@material-ui/core/styles";
import Button from "@material-ui/core/Button";
import Typography from "@material-ui/core/Typography";
import { Grid, IconButton } from "@material-ui/core";
import { TextField, Select, MenuItem, InputLabel } from "@material-ui/core";
import AddIcon from "@material-ui/icons/Add";
import CardContent from "@material-ui/core/CardContent";
import Card from "@material-ui/core/Card";
import apiService from "../../services/apiService";
import DeleteIcon from "@material-ui/icons/Delete";
import { Formik } from "formik";
import Notification from "../../common/Notification";
import CircularProgress from "@material-ui/core/CircularProgress";

function NetworkForm({
  formikProps,
  clusters,
  labels,
  placementType,
  ...props
}) {
  const [notificationDetails, setNotificationDetails] = useState({});
  const [interfaces, setInterfaces] = useState([]);
  const [totalNetworks, setTotalNetworks] = useState([]);
  const [availableNetworks, setAvailableNetworks] = useState();
  const [isLoading, setIsLoading] = useState(true);
  const useStyles = makeStyles({
    root: {
      minWidth: 275,
    },
    title: {
      fontSize: 14,
    },
    pos: {
      marginBottom: 12,
    },
  });

  const setInitState = (networkData) => {
    let interfaces = formikProps.values.apps[props.index].interfaces;
    if (interfaces) {
      let commonData = interfaces.filter((o1) =>
        networkData.some((o2) => o1.networkName === o2.name)
      );
      setInterfaces(commonData);
      formikProps.setFieldValue(`apps[${props.index}].interfaces`, commonData);
    }
  };

  const init = (networkData) => {
    setInitState(networkData);
    if (networkData.length > 0) {
      setTotalNetworks(networkData);
      setAvailableNetworks(
        getAvailableNetworks(
          networkData,
          formikProps.values.apps[props.index].interfaces
        )
      );
    } else {
      setNotificationDetails({
        show: true,
        message: `No network available for selected cluster(s)`,
        severity: "warning",
      });
    }
    setIsLoading(false);
  };

  const initNetworkDataBySelectedClusters = (
    clusterProvider,
    networkData,
    provoderIndex,
    selectedClusters
  ) => {
    selectedClusters.forEach((cluster, clusterIndex) => {
      let request = {
        providerName: clusterProvider.clusterProvider,
        clusterName: cluster.name,
      };

      apiService
        .getAllClusterNetworks(request)
        .then((res) => {
          if (res.spec.networks && res.spec.networks.length > 0) {
            res.spec.networks.forEach((network) => {
              //if two or more clusters have networks with same name, then add it only once
              if (
                networkData.findIndex(
                  (element) => element.name === network.metadata.name
                ) !== -1
              ) {
                console.log(
                  `Provider Network : ${network.metadata.name} already exists`
                );
              } else {
                networkData.push({
                  name: network.metadata.name,
                  subnets: network.spec.ipv4Subnets,
                });
              }
            });
          }

          if (
            res.spec["provider-networks"] &&
            res.spec["provider-networks"].length > 0
          ) {
            res.spec["provider-networks"].forEach((providerNetwork) => {
              //if two or more clusters have provider networks with same name, then add it only once
              if (
                networkData.findIndex(
                  (element) => element.name === providerNetwork.metadata.name
                ) !== -1
              ) {
                console.log(
                  `Network : ${providerNetwork.metadata.name} already exists`
                );
              } else {
                networkData.push({
                  name: providerNetwork.metadata.name,
                  subnets: providerNetwork.spec.ipv4Subnets,
                });
              }
            });
          }

          //set loading to false only when we get data for all the selected clusters
          if (
            provoderIndex === clusters.length - 1 &&
            clusterIndex === selectedClusters.length - 1
          ) {
            init(networkData);
          }
        })
        .catch((err) => {
          console.error("error getting cluster networks" + err);
        });
    });
  };

  const initNetworkDataBySelectedLabels = (
    clusterProvider,
    networkData,
    provoderIndex,
    labels
  ) => {
    if (labels && labels.length > 0) {
      let clusterRequests = [];
      labels.forEach((label) => {
        clusterRequests.push(
          apiService.getClustersByLabel(
            clusterProvider.clusterProvider,
            label["label-name"]
          )
        );
      });

      Promise.all(clusterRequests).then((res) => {
        let overAllClusterList = [];
        res.forEach((clusterRes) => {
          overAllClusterList = [...overAllClusterList, ...clusterRes];
        });
        //we need unique clusters so add the values in a set
        const overAllClustersSet = new Set(overAllClusterList);
        let selectedClusters = [];

        //initNetworkDataBySelectedClusters expects clusters data in this format as this function is used when passing individual clusters too
        overAllClustersSet.forEach((clusterName) => {
          selectedClusters.push({ name: clusterName });
        });

        initNetworkDataBySelectedClusters(
          clusterProvider,
          networkData,
          provoderIndex,
          selectedClusters
        );
      });
    }
  };

  useEffect(() => {
    var networkData = [];
    clusters &&
      clusters.forEach((clusterProvider, provoderIndex) => {
        if (placementType === "clusters") {
          initNetworkDataBySelectedClusters(
            clusterProvider,
            networkData,
            provoderIndex,
            clusterProvider.selectedClusters
          );
        } else {
          initNetworkDataBySelectedLabels(
            clusterProvider,
            networkData,
            provoderIndex,
            clusterProvider.selectedLabels
          );
        }
      });
  }, []);

  const handleAddNetworkInterface = (values) => {
    let updatedFields = [];
    if (values.apps[props.index].interfaces) {
      updatedFields = [
        ...values.apps[props.index].interfaces,
        {
          networkName: "",
          ip: "",
          subnet: "",
        },
      ];
    } else {
      updatedFields = [
        {
          networkName: "",
          ip: "",
          subnet: "",
        },
      ];
    }
    formikProps.setFieldValue(`apps[${props.index}].interfaces`, updatedFields);
    setInterfaces(updatedFields);
    setAvailableNetworks(getAvailableNetworks(totalNetworks, updatedFields));
  };

  const handleSelectNetowrk = (e, interfaceIndex) => {
    formikProps.handleChange(e);
    let interfaceTemp = [...interfaces];
    interfaceTemp[interfaceIndex] = {
      ...interfaceTemp[interfaceIndex],
      networkName: e.target.value,
    };
    setInterfaces(interfaceTemp);
    setAvailableNetworks(getAvailableNetworks(totalNetworks, interfaceTemp));
  };
  const handleRemoveNetwork = (interfaceIndex) => {
    let interfaceTemp = [...interfaces];
    interfaceTemp.splice(interfaceIndex, 1);
    formikProps.setFieldValue(`apps[${props.index}].interfaces`, interfaceTemp);
    setInterfaces(interfaceTemp);
    setAvailableNetworks(getAvailableNetworks(totalNetworks, interfaceTemp));
  };
  const getAvailableNetworks = (networkData, updatedFields) => {
    let availableNetworks = [];
    networkData.forEach((network) => {
      let match = false;
      updatedFields &&
        updatedFields.forEach((networkInterface) => {
          if (network.name === networkInterface.networkName) {
            match = true;
            return;
          }
        });
      if (!match) availableNetworks.push(network);
    });
    return availableNetworks;
  };

  const classes = useStyles();
  return (
    <>
      <Notification notificationDetails={notificationDetails} />
      <Grid
        key="networkForm"
        container
        spacing={3}
        style={{
          height: "400px",
          overflowY: "auto",
          width: "100%",
          marginTop: "10px",
        }}
      >
        {(!clusters || clusters.length < 1) && (
          <Grid item xs={12}>
            <Typography variant="h6">No clusters selected</Typography>
          </Grid>
        )}
        {clusters && (
          <Grid item xs={12}>
            <Card className={classes.root}>
              <CardContent>
                <Grid container spacing={2}>
                  <React.Fragment>
                    <Formik>
                      {() => {
                        const { values, errors, handleChange, handleBlur } =
                          formikProps;
                        return (
                          <>
                            {!isLoading && interfaces && interfaces.length > 0
                              ? interfaces.map(
                                  (networkInterface, interfaceIndex) => (
                                    <Grid
                                      spacing={1}
                                      container
                                      item
                                      key={interfaceIndex}
                                      xs={12}
                                    >
                                      <Grid item xs={4}>
                                        <InputLabel id="network-select-label">
                                          Network
                                        </InputLabel>
                                        <Select
                                          fullWidth
                                          labelId="network-select-label"
                                          id="network-select"
                                          name={`apps[${props.index}].interfaces[${interfaceIndex}].networkName`}
                                          value={
                                            values.apps[props.index].interfaces[
                                              interfaceIndex
                                            ].networkName
                                          }
                                          onChange={(e) => {
                                            handleSelectNetowrk(
                                              e,
                                              interfaceIndex
                                            );
                                          }}
                                        >
                                          {values.apps[props.index].interfaces[
                                            interfaceIndex
                                          ].networkName && (
                                            <MenuItem
                                              key={
                                                values.apps[props.index]
                                                  .interfaces[interfaceIndex]
                                                  .networkName
                                              }
                                              value={
                                                values.apps[props.index]
                                                  .interfaces[interfaceIndex]
                                                  .networkName
                                              }
                                            >
                                              {
                                                values.apps[props.index]
                                                  .interfaces[interfaceIndex]
                                                  .networkName
                                              }
                                            </MenuItem>
                                          )}
                                          {availableNetworks &&
                                            availableNetworks.map((network) => (
                                              <MenuItem
                                                key={network.name}
                                                value={network.name}
                                              >
                                                {network.name}
                                              </MenuItem>
                                            ))}
                                        </Select>
                                      </Grid>

                                      <Grid item xs={4}>
                                        <InputLabel id="subnet-select-label">
                                          Subnet
                                        </InputLabel>
                                        <Select
                                          fullWidth
                                          labelId="subnet-select-label"
                                          id="subnet-select-label"
                                          name={`apps[${props.index}].interfaces[${interfaceIndex}].subnet`}
                                          value={
                                            values.apps[props.index].interfaces[
                                              interfaceIndex
                                            ].subnet
                                          }
                                          onChange={handleChange}
                                        >
                                          {values.apps[props.index].interfaces[
                                            interfaceIndex
                                          ].networkName === ""
                                            ? null
                                            : totalNetworks
                                                .filter(
                                                  (network) =>
                                                    network.name ===
                                                    values.apps[props.index]
                                                      .interfaces[
                                                      interfaceIndex
                                                    ].networkName
                                                )[0]
                                                .subnets.map((subnet) => (
                                                  <MenuItem
                                                    key={subnet.name}
                                                    value={subnet.name}
                                                  >
                                                    {subnet.name}(
                                                    {subnet.subnet})
                                                  </MenuItem>
                                                ))}
                                        </Select>
                                      </Grid>
                                      <Grid item xs={3}>
                                        <TextField
                                          width={"65%"}
                                          name={`apps[${props.index}].interfaces[${interfaceIndex}].ip`}
                                          onBlur={handleBlur}
                                          id="ip"
                                          label="IP Address"
                                          value={
                                            values.apps[props.index].interfaces[
                                              interfaceIndex
                                            ].ip
                                          }
                                          onChange={handleChange}
                                          helperText={
                                            (errors.apps &&
                                              errors.apps[props.index] &&
                                              errors.apps[props.index]
                                                .interfaces &&
                                              errors.apps[props.index]
                                                .interfaces[interfaceIndex] &&
                                              errors.apps[props.index]
                                                .interfaces[interfaceIndex]
                                                .ip) ||
                                            "blank for auto assign"
                                          }
                                          error={
                                            errors.apps &&
                                            errors.apps[props.index] &&
                                            errors.apps[props.index].interfaces[
                                              interfaceIndex
                                            ] &&
                                            errors.apps[props.index].interfaces[
                                              interfaceIndex
                                            ].ip &&
                                            true
                                          }
                                        />
                                      </Grid>
                                      <Grid item xs={1}>
                                        <IconButton
                                          color="secondary"
                                          onClick={() => {
                                            handleRemoveNetwork(interfaceIndex);
                                          }}
                                        >
                                          <DeleteIcon fontSize="small" />
                                        </IconButton>
                                      </Grid>
                                    </Grid>
                                  )
                                )
                              : null}
                            <Grid item xs={12}>
                              <Button
                                variant="outlined"
                                size="small"
                                fullWidth
                                color="primary"
                                disabled={
                                  totalNetworks.length === interfaces.length
                                }
                                onClick={() => {
                                  handleAddNetworkInterface(values);
                                }}
                                startIcon={
                                  isLoading ? (
                                    <CircularProgress
                                      style={{ width: "20px", height: "20px" }}
                                    />
                                  ) : (
                                    <AddIcon />
                                  )
                                }
                              >
                                Add Network Interface
                              </Button>
                            </Grid>
                          </>
                        );
                      }}
                    </Formik>
                  </React.Fragment>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>
    </>
  );
}

export default NetworkForm;
