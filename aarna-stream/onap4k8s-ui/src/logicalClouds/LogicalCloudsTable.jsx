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
import { Backdrop, CircularProgress, IconButton } from "@material-ui/core";
import DeleteIcon from "@material-ui/icons/DeleteTwoTone";
import apiService from "../services/apiService";
import DeleteDialog from "../common/Dialogue";
import Notification from "../common/Notification";

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

const useStyles = makeStyles((theme) => ({
  table: {
    minWidth: 350,
  },
  cell: {
    color: "grey",
  },
  backdrop: {
    zIndex: theme.zIndex.drawer + 9999,
    color: "#fff",
  },
}));

export default function LogicalCloudsTable(props) {
  const [loading, setLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [activeRowIndex, setActiveRowIndex] = useState(0);
  const [notificationDetails, setNotificationDetails] = useState({});

  const handleDelete = (index) => {
    setActiveRowIndex(index);
    setOpenDialog(true);
  };

  const deleteLogicalCloud = (req) => {
    apiService
      .deleteLogicalCloud(req)
      .then((res) => {
        console.log("logical cloud deleted");
        setLoading(false);
        props.data.splice(activeRowIndex, 1);
        setNotificationDetails({
          show: true,
          message: `Logical cloud deleted`,
          severity: "success",
        });
        props.setData([...props.data]);
      })
      .catch((err) => {
        setLoading(false);
        setNotificationDetails({
          show: true,
          message: `Unable to delete logical cloud : ${err.response.data}`,
          severity: "error",
        });
        console.error("error deleting logical cloud : " + err);
      });
  };

  const deleteLCReferences = (req) => {
    let deleteReferencesUrlArray = [];
    apiService
      .getLogicalCloudClusterReferences(req)
      .then((res) => {
        res.forEach((cr) => {
          req.clusterReferenceName = cr.metadata.name;
          deleteReferencesUrlArray.push(
            apiService.deleteLogicalCloudClusterReference(req)
          );
        });
        Promise.all([...deleteReferencesUrlArray]).then((values) => {
          deleteLogicalCloud(req);
        });
      })
      .catch((refErr) => {
        console.error(refErr);
        if (refErr.response.data.includes("No Cluster References associated")) {
          deleteLogicalCloud(req);
        } else {
          console.error("error getting cluster references");
          setLoading(false);
          setNotificationDetails({
            show: true,
            message: `Unable to delete logical cloud : ${refErr.response.data}`,
            severity: "error",
          });
        }
      });
  };
  const handleCloseDialog = (el) => {
    const logicalCloudToDelete = props.data[activeRowIndex].metadata.name;
    if (el.target.innerText === "Delete") {
      setLoading(true);
      let hasReferences = false;
      apiService
        .getDeploymentIntentGroups({ projectName: props.projectName })
        .then((res) => {
          res &&
            res.length > 0 &&
            res.forEach((dig) => {
              if (dig.spec.logicalCloud === logicalCloudToDelete) {
                setLoading(false);
                setNotificationDetails({
                  show: true,
                  message:
                    "Unable to delete logical cloud because it is referred in one or more service instances",
                  severity: "error",
                });
                hasReferences = true;
                return;
              }
            });
          if (!hasReferences) {
            const req = {
              projectName: props.projectName,
              logicalCloudName: logicalCloudToDelete,
            };

            apiService
              .terminateLogicalCloud(req)
              .then((res) => {
                deleteLCReferences(req);
              })
              .catch((err) => {
                if (
                  err.response.data.includes(
                    "Logical Cloud is not instantiated"
                  ) ||
                  err.response.data.includes(
                    "The Logical Cloud has already been terminated"
                  ) ||
                  err.response.data.includes("No Cluster References associated")
                ) {
                  deleteLCReferences(req);
                } else {
                  setNotificationDetails({
                    show: true,
                    message: `Unable to delete logical cloud : ${err.response.data}`,
                    severity: "error",
                  });
                  setLoading(false);
                }
              });
          }
        })
        .catch((err) => console.error(err));
    }
    setOpenDialog(false);
    setActiveRowIndex(0);
  };
  const classes = useStyles();
  return (
    <React.Fragment>
      <Backdrop className={classes.backdrop} open={loading}>
        <CircularProgress color="primary" />
      </Backdrop>
      <Notification notificationDetails={notificationDetails} />
      <DeleteDialog
        open={openDialog}
        onClose={handleCloseDialog}
        title={"Delete Logical Cloud"}
        content={`Are you sure you want to delete "${
          props.data[activeRowIndex]
            ? props.data[activeRowIndex].metadata.name
            : ""
        }" ?`}
      />
      {props.data && props.data.length > 0 && (
        <>
          <TableContainer component={Paper}>
            <Table className={classes.table} size="small">
              <TableHead>
                <TableRow>
                  <StyledTableCell>Name</StyledTableCell>
                  <StyledTableCell>Description</StyledTableCell>
                  <StyledTableCell>Actions</StyledTableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {props.data.map((row, index) => (
                  <StyledTableRow key={row.metadata.name + "" + index}>
                    <StyledTableCell>{row.metadata.name}</StyledTableCell>
                    <StyledTableCell className={classes.cell}>
                      {row.metadata.description}
                    </StyledTableCell>
                    <StyledTableCell className={classes.cell}>
                      <IconButton
                        color="secondary"
                        onClick={(e) => handleDelete(index)}
                        title="Delete"
                      >
                        <DeleteIcon />
                      </IconButton>
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
