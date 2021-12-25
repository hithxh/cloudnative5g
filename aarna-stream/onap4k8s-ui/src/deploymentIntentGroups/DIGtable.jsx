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
import React, { useState } from "react";
import { withStyles, makeStyles } from "@material-ui/core/styles";
import Table from "@material-ui/core/Table";
import TableBody from "@material-ui/core/TableBody";
import TableCell from "@material-ui/core/TableCell";
import TableContainer from "@material-ui/core/TableContainer";
import TableHead from "@material-ui/core/TableHead";
import TableRow from "@material-ui/core/TableRow";
import Paper from "@material-ui/core/Paper";
import IconButton from "@material-ui/core/IconButton";
import DeleteDialog from "../common/Dialogue";
import apiService from "../services/apiService";
import Notification from "../common/Notification";
import { Link, useHistory } from "react-router-dom";
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  CloudOffOutlined as CloudOffOutlinedIcon,
  BackupOutlined as BackupOutlinedIcon,
} from "@material-ui/icons";

const StyledTableCell = withStyles((theme) => ({
  body: {
    fontSize: 14,
  },
}))(TableCell);

const StyledTableRow = withStyles((theme) => ({
  root: {
    "&:nth-of-type(odd)": {
      backgroundColor: theme.palette.action.hover,
    },
  },
}))(TableRow);

const useStyles = makeStyles({
  table: {
    minWidth: 350,
  },
  cell: {
    color: "grey",
  },
});

export default function DIGtable({ data, setData, ...props }) {
  const classes = useStyles();
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);
  const [notificationDetails, setNotificationDetails] = useState({});
  const [confirmationDetails, setConfirmationDetails] = useState({
    confirmationButtonText: "",
    conformationTitle: "",
    conformationContent: "",
  });
  let history = useHistory();
  const handleCloseDialog = (el) => {
    let request = {
      projectName: props.projectName,
      compositeAppName: data[index].metadata.compositeAppName,
      compositeAppVersion: data[index].metadata.compositeAppVersion,
      deploymentIntentGroupName: data[index].metadata.name,
    };
    if (el.target.innerText === "Delete") {
      deleteService(index, request);
    } else if (el.target.innerText === "Terminate") {
      terminateService(index, request);
    } else if (el.target.innerText === "OK") {
      instantiateService(index, request);
    }
    setOpen(false);
    setIndex(-1);
  };
  const handleDelete = (index) => {
    setIndex(index);
    setOpen(true);
    setConfirmationDetails({
      confirmationButtonText: "Delete",
      conformationTitle: "Delete",
      conformationContent: `Are you sure you want to delete "${
        data[index] ? data[index].metadata.name : ""
      }" ?`,
    });
  };

  const handleTerminate = (index) => {
    setIndex(index);
    setOpen(true);
    setConfirmationDetails({
      confirmationButtonText: "Terminate",
      conformationTitle: "Terminate",
      conformationContent: `Are you sure you want to terminate "${
        data[index] ? data[index].metadata.name : ""
      }" ?`,
    });
  };

  const handleInstantiate = (index) => {
    setIndex(index);
    setOpen(true);
    setConfirmationDetails({
      confirmationButtonText: "OK",
      conformationTitle: "Instantiate",
      conformationContent: `Are you sure you want to instantiate "${
        data[index] ? data[index].metadata.name : ""
      }" ?`,
    });
  };

  const instantiateService = (index, request) => {
    const instantiateService = () => {
      apiService
        .instantiate(request)
        .then((res) => {
          console.log("Service instantiated : " + res);
          let updatedData = [...data];
          updatedData[index].spec.status = "Instantiated";
          setData([...updatedData]);
          setNotificationDetails({
            show: true,
            message: `Service "${data[index].metadata.name}" instantiated`,
            severity: "success",
          });
        })
        .catch((err) => {
          console.error(
            `Error instantiating "${data[index].metadata.name}" service: ` + err
          );
          let errorMessage =
            err.response && err.response.data ? err.response.data : err;
          setNotificationDetails({
            show: true,
            message: `Error instantiating "${data[index].metadata.name}" service : ${errorMessage}`,
            severity: "error",
          });
        });
    };
    if (data[index].spec.status === "Approved") {
      instantiateService();
    } else {
      apiService
        .approveDeploymentIntentGroup(request)
        .then(() => {
          console.log(
            "Deployment intent group approved, now going to instantiate"
          );
          instantiateService();
        })
        .catch((err) => {
          console.log(
            `Error approving "${data[index].metadata.name}" service : ` + err
          );
          setNotificationDetails({
            show: true,
            message: `Error approving "${data[index].metadata.name}" service`,
            severity: "error",
          });
        });
    }
  };

  const terminateService = (index, request) => {
    apiService
      .terminateDeploymentIntentGroup(request)
      .then(() => {
        console.log("Service terminated");
        let updatedData = [...data];
        updatedData[index].spec.status = "Terminated";
        setData([...updatedData]);
        setNotificationDetails({
          show: true,
          message: `Service "${data[index].metadata.name}" terminated`,
          severity: "success",
        });
      })
      .catch((err) => {
        console.log("Error terminating DIG : ", err);
      });
  };
  const deleteService = (index, request) => {
    apiService
      .deleteDeploymentIntentGroup(request)
      .then(() => {
        console.log("DIG deleted");
        data.splice(index, 1);
        setData([...data]);
      })
      .catch((err) => {
        console.log("Error deleting DIG : ", err);
      });
  };

  return (
    <React.Fragment>
      <Notification notificationDetails={notificationDetails} />
      {data && data.length > 0 && (
        <>
          <DeleteDialog
            confirmationText={confirmationDetails.confirmationButtonText}
            open={open}
            onClose={handleCloseDialog}
            title={confirmationDetails.conformationTitle}
            content={confirmationDetails.conformationContent}
          />
          <TableContainer component={Paper}>
            <Table className={classes.table} size="small">
              <TableHead>
                <TableRow>
                  <StyledTableCell>Name</StyledTableCell>
                  <StyledTableCell>Version</StyledTableCell>
                  <StyledTableCell>Status</StyledTableCell>
                  <StyledTableCell>Logical Cloud</StyledTableCell>
                  <StyledTableCell>Config Override</StyledTableCell>
                  <StyledTableCell>Service</StyledTableCell>
                  <StyledTableCell>Description</StyledTableCell>
                  <StyledTableCell style={{ width: "15%" }}>
                    Actions
                  </StyledTableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.map((row, index) => (
                  <StyledTableRow key={row.metadata.name + "" + index}>
                    <StyledTableCell>
                      <Link
                        to={`deployment-intent-groups/${row.metadata.compositeAppName}/${row.metadata.compositeAppVersion}/${row.metadata.name}/status`}
                      >
                        {row.metadata.name}
                      </Link>
                    </StyledTableCell>
                    <StyledTableCell className={classes.cell}>
                      {row.spec.version}
                    </StyledTableCell>
                    <StyledTableCell className={classes.cell}>
                      {row.spec.status}
                    </StyledTableCell>
                    <StyledTableCell className={classes.cell}>
                      {row.spec.logicalCloud}
                    </StyledTableCell>
                    <StyledTableCell className={classes.cell}>
                      {row.spec.profile}
                    </StyledTableCell>
                    <StyledTableCell className={classes.cell}>
                      {row.metadata.compositeAppName}&nbsp;|&nbsp;
                      {row.metadata.compositeAppVersion}
                    </StyledTableCell>
                    <StyledTableCell className={classes.cell}>
                      {row.metadata.description}
                    </StyledTableCell>
                    <StyledTableCell className={classes.cell}>
                      <IconButton
                        disabled={row.spec.status === "Instantiated"}
                        title="Instantiate"
                        onClick={(e) => handleInstantiate(index)}
                        color={"primary"}
                      >
                        <BackupOutlinedIcon />
                      </IconButton>
                      <IconButton
                        disabled={row.spec.status !== "Instantiated"}
                        onClick={(e) => handleTerminate(index)}
                        title="Terminate"
                        color="secondary"
                      >
                        <CloudOffOutlinedIcon />
                      </IconButton>
                      <IconButton
                        disabled={row.spec.status === "Instantiated"}
                        onClick={(e) => handleDelete(index)}
                        title="Delete"
                        color="secondary"
                      >
                        <DeleteIcon />
                      </IconButton>
                      {row.spec.is_checked_out && (
                        <IconButton
                          style={{ float: "right" }}
                          onClick={(e) =>
                            history.push(
                              history.location.pathname +
                                `/${row.metadata.compositeAppName}/${row.spec.targetVersion}/${row.metadata.name}/checkout`
                            )
                          }
                          title="Edit"
                          color="primary"
                        >
                          <EditIcon />
                        </IconButton>
                      )}
                    </StyledTableCell>
                  </StyledTableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}
    </React.Fragment>
  );
}
