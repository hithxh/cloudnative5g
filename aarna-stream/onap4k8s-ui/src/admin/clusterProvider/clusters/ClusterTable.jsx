//=======================================================================
// Copyright (c) 2017-2020 Aarna Networks, Inc.
// All rights reserved.
// ======================================================================
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//           http://www.apache.org/licenses/LICENSE-2.0
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
// ========================================================================
import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import AddIconOutline from "@material-ui/icons/AddCircleOutline";
// import EditIcon from "@material-ui/icons/Edit";
// import DeleteIcon from "@material-ui/icons/Delete";
import DeleteIcon from "@material-ui/icons/DeleteTwoTone";
import NetworkForm from "../networks/NetworkForm";
import apiService from "../../../services/apiService";
import DeleteDialog from "../../../common/Dialogue";
import CancelOutlinedIcon from "@material-ui/icons/CancelOutlined";
import CheckIcon from "@material-ui/icons/CheckCircleOutlineOutlined";
import InfoOutlinedIcon from "@material-ui/icons/InfoOutlined";
import NetworkDetailsDialog from "../../../common/DetailsDialog";
import DoneOutlineIcon from "@material-ui/icons/DoneOutline";
// import ClusterForm from "../clusters/ClusterForm";
import Notification from "../../../common/Notification";
import KeyboardArrowDownIcon from "@material-ui/icons/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@material-ui/icons/KeyboardArrowUp";
import CloudOffTwoToneIcon from "@material-ui/icons/CloudOffTwoTone";
import {
  Box,
  Chip,
  IconButton,
  Collapse,
  Typography,
  TextField,
  Backdrop,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  makeStyles,
} from "@material-ui/core";

const useStyles = makeStyles((theme) => ({
  backdrop: {
    zIndex: theme.zIndex.drawer + 9999,
    color: "#fff",
  },
}));

const NetworkTableRow = ({
  handleNetworkDetailOpen,
  handleDeleteNetwork,
  providerRowIndex,
  type,
  data,
  ...props
}) => {
  return data.map((entry, index) => (
    <TableRow key={entry.metadata.name + "" + index}>
      <TableCell component="th" scope="row">
        {entry.metadata.name}
      </TableCell>
      <TableCell>
        {type === "networks" ? "Network" : "Provider Network"}
      </TableCell>
      <TableCell>{entry.spec["rsync-status"]}</TableCell>
      <TableCell>{entry.metadata.description}</TableCell>
      <TableCell>
        <IconButton
          title="Network Info"
          color="primary"
          onClick={() => {
            handleNetworkDetailOpen(entry);
          }}
        >
          <InfoOutlinedIcon />
        </IconButton>
        <IconButton
          title="Delete"
          color="secondary"
          disabled={entry.spec["rsync-status"] === "Applied"}
          onClick={(e) => {
            handleDeleteNetwork(
              providerRowIndex,
              index,
              type,
              entry.metadata.name
            );
          }}
        >
          <DeleteIcon />
        </IconButton>
      </TableCell>
    </TableRow>
  ));
};

// NetworkTableRow.propTypes = {
//   data: PropTypes.arrayOf(
//       PropTypes.shape({
//         amount: PropTypes.number.isRequired,
//         customerId: PropTypes.string.isRequired,
//         date: PropTypes.string.isRequired,
//       }),
//     ).isRequired
// };
const ClusterTable = ({ clustersData, ...props }) => {
  const classes = useStyles();
  const [formOpen, setformOpen] = useState(false);
  const [networkDetails, setNetworkDetails] = useState({
    open: false,
    data: {},
  });
  const [activeRowIndex, setActiveRowIndex] = useState(0);
  const [activeNetwork, setActiveNetwork] = useState({});
  const [open, setOpen] = useState(false);
  const [openDeleteNetwork, setOpenDeleteNetwork] = useState(false);
  const [showAddLabel, setShowAddLabel] = useState(false);
  const [labelInput, setLabelInput] = useState("");
  //   const [clusterFormOpen, setClusterFormOpen] = useState(false);
  const [notificationDetails, setNotificationDetails] = useState({});
  const [expandedRows, setExpandedRows] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const handleFormClose = () => {
    setformOpen(false);
  };

  useEffect(() => {
    //auto expand newly added cluster row, so network related info is visible whenever a user added a new cluster.
    const newAddedCluster = clustersData.filter((cluster) => cluster.isNew);
    if (newAddedCluster.length === 1) {
      setExpandedRows((expandedRows) => {
        return { ...expandedRows, [newAddedCluster[0].metadata.name]: true };
      });
    }
  }, [clustersData]);

  const handleSubmit = (data) => {
    let networkSpec = JSON.parse(data.spec);
    let payload = {
      metadata: { name: data.name, description: data.description },
      spec: networkSpec,
    };
    let request = {
      providerName: props.providerName,
      clusterName: clustersData[activeRowIndex].metadata.name,
      networkType: data.type,
      payload: payload,
    };
    apiService
      .addNetwork(request)
      .then(() => {
        props.onRefreshNetworkData(props.parentIndex, activeRowIndex);
      })
      .catch((err) => {
        console.log("error adding cluster network : ", err);
      })
      .finally(() => {
        setActiveRowIndex(0);
        setformOpen(false);
      });
  };
  const handleAddNetwork = (index) => {
    setActiveRowIndex(index);
    setformOpen(true);
  };
  const handleDeleteLabel = (index, label, labelIndex) => {
    let request = {
      providerName: props.providerName,
      clusterName: clustersData[index].metadata.name,
      labelName: label,
    };
    apiService
      .deleteClusterLabel(request)
      .then((res) => {
        console.log("label deleted");
        clustersData[index].labels.splice(labelIndex, 1);
        props.onUpdateCluster(props.parentIndex, clustersData);
      })
      .catch((err) => {
        console.log("error deleting label : ", err);
      });
  };
  const handleClose = (el) => {
    if (el.target.innerText === "Delete") {
      let request = {
        providerName: props.providerName,
        clusterName: clustersData[activeRowIndex].metadata.name,
      };
      apiService
        .deleteCluster(request)
        .then(() => {
          console.log("cluster deleted");
          props.onDeleteCluster(props.parentIndex, activeRowIndex);
        })
        .catch((err) => {
          console.log("Error deleting cluster : ", +err);
          setNotificationDetails({
            show: true,
            message: "Unable to remove cluster",
            severity: "error",
          });
        });
    }
    setOpen(false);
    setActiveRowIndex(0);
  };

  const handleCloseDeleteNetwork = (el) => {
    if (el.target.innerText === "Delete") {
      let networkName =
        clustersData[activeRowIndex][activeNetwork.networkType][
          activeNetwork.networkIndex
        ].metadata.name;
      let networkType =
        activeNetwork.networkType === "providerNetworks"
          ? "provider-networks"
          : "networks";
      let request = {
        providerName: props.providerName,
        clusterName: clustersData[activeRowIndex].metadata.name,
        networkType: networkType,
        networkName: networkName,
      };
      apiService
        .deleteClusterNetwork(request)
        .then(() => {
          console.log("cluster network deleted");
          clustersData[activeRowIndex][activeNetwork.networkType].splice(
            activeNetwork.networkIndex,
            1
          );
        })
        .catch((err) => {
          console.log("Error deleting cluster network : ", err);
        })
        .finally(() => {
          setActiveRowIndex(0);
          setActiveNetwork({});
        });
    }
    setOpenDeleteNetwork(false);
  };
  const handleDeleteCluster = (index) => {
    setActiveRowIndex(index);
    setOpen(true);
  };
  const handleAddLabel = (index) => {
    if (labelInput !== "") {
      let request = {
        providerName: props.providerName,
        clusterName: clustersData[activeRowIndex].metadata.name,
        payload: { "label-name": labelInput },
      };
      apiService
        .addClusterLabel(request)
        .then((res) => {
          !clustersData[index].labels || clustersData[index].labels === null
            ? (clustersData[index].labels = [res])
            : clustersData[index].labels.push(res);
        })
        .catch((err) => {
          console.log("error adding label", err);
        })
        .finally(() => {
          setShowAddLabel(!showAddLabel);
        });
    }
  };

  const handleToggleAddLabel = (index) => {
    setShowAddLabel(showAddLabel === index ? false : index);
    setActiveRowIndex(index);
    setLabelInput("");
  };
  const handleLabelInputChange = (event) => {
    setLabelInput(event.target.value);
  };

  const handleNetworkDetailOpen = (network) => {
    //not the best way to do a deep copy....
    let networkDetails = JSON.parse(JSON.stringify(network));

    //spec contains rsync-status too, we dont want to show that in details. We want to show the spec which was used during the creation of the network.
    delete networkDetails.spec["rsync-status"];
    setNetworkDetails({ open: true, data: networkDetails });
  };
  const handleDeleteNetwork = (
    index,
    networkIndex,
    networkType,
    networkName
  ) => {
    setActiveNetwork({
      networkIndex: networkIndex,
      networkType: networkType,
      name: networkName,
    });
    setActiveRowIndex(index);
    setOpenDeleteNetwork(true);
  };
  //   const handleClusterFormClose = () => {
  //     setClusterFormOpen(false);
  //   };
  //   const handleClusterSubmit = (values) => {
  //     const formData = new FormData();
  //     if (values.file) formData.append("file", values.file);
  //     formData.append(
  //       "metadata",
  //       `{"metadata":{ "name": "${values.name}", "description": "${values.description}" }}`
  //     );
  //     formData.append("providerName", props.providerName);
  //     apiService
  //       .updateCluster(formData)
  //       .then((res) => {
  //         clustersData[activeRowIndex].metadata = res.metadata;
  //         props.onUpdateCluster(props.parentIndex, clustersData);
  //       })
  //       .catch((err) => {
  //         console.log("error updating cluster : ", err);
  //       })
  //       .finally(() => {
  //         handleClusterFormClose();
  //       });
  //   };
  //disabling as edit is not supported yet by the api yet
  //   const handleEditCluster = (index) => {
  //     setActiveRowIndex(index);
  //     setClusterFormOpen(true);
  //   };

  const handleRowExpand = (row) => {
    if (row) {
      setExpandedRows({
        ...expandedRows,
        [row.metadata.name]: !expandedRows[row.metadata.name],
      });
    } else {
      if (Object.keys(expandedRows).length > 0) {
        setExpandedRows({});
      } else {
        let expandRowsData = {};
        clustersData.forEach((cluster) => {
          expandRowsData[cluster.metadata.name] = true;
        });
        setExpandedRows({
          ...expandRowsData,
        });
      }
    }
  };

  const applyNetworkConfig = (clusterName, clusterIndex) => {
    setIsLoading(true);
    let request = {
      providerName: props.providerName,
      clusterName: clusterName,
    };
    apiService
      .applyNetworkConfig(request)
      .then((res) => {
        setTimeout(() => {
          props.onRefreshNetworkData(props.parentIndex, clusterIndex);
          setNotificationDetails({
            show: true,
            message: "Network configuration applied",
            severity: "success",
          });
          setIsLoading(false);
        }, 1000);

        console.log("Network config applied");
      })
      .catch((err) => {
        setNotificationDetails({
          show: true,
          message: "Error applying network configuration",
          severity: "error",
        });
        if (err.response)
          console.log("Network config applied" + err.response.data);
        else console.log("Error applying network config : ", err);
      });
  };

  const handleTerminateNetworkConfig = (clusterName, clusterIndex) => {
    setIsLoading(true);
    let request = {
      providerName: props.providerName,
      clusterName: clusterName,
    };
    apiService
      .terminateNetworkConfig(request)
      .then((res) => {
        setTimeout(() => {
          props.onRefreshNetworkData(props.parentIndex, clusterIndex);
          setNotificationDetails({
            show: true,
            message: "Terminated Network configuration",
            severity: "success",
          });
          setIsLoading(false);
        }, 1000);
        console.log("Network config terminated");
      })
      .catch((err) => {
        setNotificationDetails({
          show: true,
          message: "Error terminating network configuration",
          severity: "error",
        });
        if (err.response)
          console.log("Error terminating network config" + err.response.data);
        else console.log("Error terminating network config" + err);
      });
  };

  return (
    <>
      <Backdrop className={classes.backdrop} open={isLoading}>
        <CircularProgress color="primary" />
      </Backdrop>
      <Notification notificationDetails={notificationDetails} />
      {clustersData && clustersData.length > 0 && (
        <>
          {/* <ClusterForm
            item={clustersData[activeRowIndex]}
            open={clusterFormOpen}
            onClose={handleClusterFormClose}
            onSubmit={handleClusterSubmit}
          /> */}
          <NetworkDetailsDialog
            onClose={(isOpen) => {
              setNetworkDetails({ ...networkDetails, open: isOpen });
            }}
            open={networkDetails.open}
            item={networkDetails.data}
            type="Network"
          />
          <NetworkForm
            onClose={handleFormClose}
            onSubmit={handleSubmit}
            open={formOpen}
          />
          <DeleteDialog
            open={open}
            onClose={handleClose}
            title={"Delete Cluster"}
            content={`Are you sure you want to delete "${
              clustersData[activeRowIndex]
                ? clustersData[activeRowIndex].metadata.name
                : ""
            }" ?`}
          />
          <DeleteDialog
            open={openDeleteNetwork}
            onClose={handleCloseDeleteNetwork}
            title={"Delete Network"}
            content={`Are you sure you want to delete "${activeNetwork.name}" ?`}
          />
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell style={{ width: "3%" }}>
                    <IconButton
                      aria-label="expand row"
                      size="small"
                      onClick={() => {
                        handleRowExpand();
                      }}
                    >
                      {Object.keys(expandedRows).length > 0 ? (
                        <KeyboardArrowUpIcon />
                      ) : (
                        <KeyboardArrowDownIcon />
                      )}
                    </IconButton>
                  </TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell style={{ width: "45%" }}>Labels </TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {clustersData.map((row, index) => (
                  <React.Fragment key={row.metadata.name + index}>
                    <TableRow
                      style={{ backgroundColor: "rgba(0, 0, 0, 0.04)" }}
                    >
                      <TableCell>
                        <IconButton
                          aria-label="expand row"
                          size="small"
                          onClick={() => {
                            handleRowExpand(row);
                          }}
                        >
                          {expandedRows[row.metadata.name] ? (
                            <KeyboardArrowUpIcon />
                          ) : (
                            <KeyboardArrowDownIcon />
                          )}
                        </IconButton>
                      </TableCell>
                      <TableCell>{row.metadata.name}</TableCell>
                      <TableCell>{row.metadata.description}</TableCell>
                      <TableCell>
                        {row.labels &&
                          row.labels.length > 0 &&
                          row.labels.map((label, labelIndex) => (
                            <Chip
                              key={label["label-name"] + "" + labelIndex}
                              size="small"
                              label={label["label-name"]}
                              onDelete={(e) => {
                                handleDeleteLabel(
                                  index,
                                  label["label-name"],
                                  labelIndex
                                );
                              }}
                              color="primary"
                              style={{ marginRight: "10px" }}
                            />
                          ))}
                        {showAddLabel === index && (
                          <TextField
                            style={{ height: "24px" }}
                            size="small"
                            value={labelInput}
                            onChange={handleLabelInputChange}
                            id="outlined-basic"
                            label="Add label"
                            variant="outlined"
                          />
                        )}
                        {showAddLabel === index && (
                          <IconButton
                            color="primary"
                            onClick={() => {
                              handleAddLabel(index);
                            }}
                          >
                            <CheckIcon />
                          </IconButton>
                        )}
                        <IconButton
                          color="primary"
                          onClick={() => {
                            handleToggleAddLabel(index);
                          }}
                        >
                          {!(showAddLabel === index) && <AddIconOutline />}
                          {showAddLabel === index && (
                            <CancelOutlinedIcon color="secondary" />
                          )}
                        </IconButton>
                      </TableCell>
                      <TableCell>
                        <IconButton
                          title="Delete"
                          color="secondary"
                          disabled={
                            (row.networks && row.networks.length > 0) ||
                            (row.providerNetworks &&
                              row.providerNetworks.length > 0) ||
                            (row.labels && row.labels.length > 0)
                          }
                          onClick={() => {
                            handleDeleteCluster(index);
                          }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                    <TableRow key={row.metadata.name + "" + index + "networks"}>
                      <TableCell
                        style={{ paddingBottom: 0, paddingTop: 0 }}
                        colSpan={7}
                      >
                        <Collapse
                          in={expandedRows[row.metadata.name]}
                          timeout="auto"
                          unmountOnExit
                        >
                          <Box margin={1}>
                            <Typography variant="h6" component="div">
                              Networks
                            </Typography>
                            <div>
                              <IconButton
                                disabled={
                                  !(
                                    row.networksStaus === "Created" ||
                                    row.networksStaus === "Terminated"
                                  )
                                }
                                variant="outlined"
                                color="primary"
                                title="Add Network"
                                onClick={() => {
                                  handleAddNetwork(index);
                                }}
                              >
                                <AddIconOutline />
                              </IconButton>
                              <IconButton
                                color="primary"
                                disabled={
                                  !(
                                    row.networksStaus === "Created" ||
                                    row.networksStaus === "Terminated"
                                  ) ||
                                  !(
                                    (row.networks && row.networks.length > 0) ||
                                    (row.providerNetworks &&
                                      row.providerNetworks.length > 0)
                                  )
                                }
                                onClick={() => {
                                  applyNetworkConfig(row.metadata.name, index);
                                }}
                                title="Apply Network Configuration"
                              >
                                <DoneOutlineIcon />
                              </IconButton>
                              <IconButton
                                color="secondary"
                                disabled={
                                  row.networksStaus !== "Instantiated" ||
                                  !(
                                    (row.networks && row.networks.length > 0) ||
                                    (row.providerNetworks &&
                                      row.providerNetworks.length > 0)
                                  )
                                }
                                onClick={() => {
                                  handleTerminateNetworkConfig(
                                    row.metadata.name,
                                    index
                                  );
                                }}
                                title="Terminate Network Configuration"
                              >
                                <CloudOffTwoToneIcon />
                              </IconButton>
                            </div>
                            <Table size="small" aria-label="purchases">
                              <TableHead>
                                <TableRow>
                                  <TableCell style={{ width: "20%" }}>
                                    Name
                                  </TableCell>
                                  <TableCell style={{ width: "10%" }}>
                                    Type
                                  </TableCell>
                                  <TableCell style={{ width: "10%" }}>
                                    Status
                                  </TableCell>
                                  <TableCell style={{ width: "40%" }}>
                                    Description
                                  </TableCell>
                                  <TableCell>Actions</TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {row.networks && row.networks.length > 0 && (
                                  <NetworkTableRow
                                    providerRowIndex={index}
                                    handleNetworkDetailOpen={
                                      handleNetworkDetailOpen
                                    }
                                    handleDeleteNetwork={handleDeleteNetwork}
                                    type={"networks"}
                                    data={row.networks}
                                  />
                                )}
                                {row.providerNetworks &&
                                  row.providerNetworks.length > 0 && (
                                    <NetworkTableRow
                                      providerRowIndex={index}
                                      handleNetworkDetailOpen={
                                        handleNetworkDetailOpen
                                      }
                                      handleDeleteNetwork={handleDeleteNetwork}
                                      type={"providerNetworks"}
                                      data={row.providerNetworks}
                                    />
                                  )}
                              </TableBody>
                            </Table>
                          </Box>
                        </Collapse>
                      </TableCell>
                    </TableRow>
                  </React.Fragment>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}
      {(!clustersData || clustersData.length === 0) && <span>No Clusters</span>}
    </>
  );
};
ClusterTable.propTypes = {
  clusters: PropTypes.arrayOf(PropTypes.object),
};
export default ClusterTable;
