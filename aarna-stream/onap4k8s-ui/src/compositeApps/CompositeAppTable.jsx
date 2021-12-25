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
import { withStyles, makeStyles } from "@material-ui/core/styles";
import TableBody from "@material-ui/core/TableBody";
import TableCell from "@material-ui/core/TableCell";
import TableContainer from "@material-ui/core/TableContainer";
import TableHead from "@material-ui/core/TableHead";
import TableRow from "@material-ui/core/TableRow";
import Paper from "@material-ui/core/Paper";
import IconButton from "@material-ui/core/IconButton";
import DeleteIcon from "@material-ui/icons/DeleteTwoTone";
import EditIcon from "@material-ui/icons/Edit";
import { Link, withRouter } from "react-router-dom";
import {
  Typography,
  Table,
  FormControl,
  Select,
  MenuItem,
  InputBase,
} from "@material-ui/core";

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
    "& .MuiTableCell-head": { textTransform: "upperCase" },
    "& .MuiTableCell-body": {
      color: "grey",
      "& a": {
        color: theme.palette.primary.main,
        fontWeight: 500,
        textDecoration: "none",
        cursor: "pointer",
      },
      "& a:hover": {
        textDecoration: "underline",
      },
    },
  },
  noRecords: {
    marginTop: "20px",
    backgroundColor: theme.palette.action.hover,
    textAlign: "center",
  },
  menuPaper: {
    maxHeight: 200,
  },
}));

function CustomizedTables({ data, handleDeleteCompositeApp, ...props }) {
  const [selectedVersions, setSelectedVersions] = useState(null);
  const classes = useStyles();
  useEffect(() => {
    let versions = {};
    data.forEach((item) => {
      item.spec.sort(sortDataByVersion);
      versions = {
        ...versions,
        [item.metadata.name]: item.spec[item.spec.length - 1],
      };
    });
    setSelectedVersions(versions);
  }, [data]);

  const onSelectVersion = (name, event) => {
    setSelectedVersions({
      ...selectedVersions,
      [name]: event.target.value,
    });
  };

  const onEditCompositeApp = (service) => {
    let path = `services/${service.metadata.name}/${
      selectedVersions[service.metadata.name].version
    }`;
    props.history.push({
      pathname: path,
    });
  };

  const getStatus = (appName) => {
    let status;
    if (selectedVersions[appName].status === "checkout") {
      status = "Checkout";
    } else if (selectedVersions[appName].deploymentIntentGroups) {
      status = `${selectedVersions[appName].deploymentIntentGroups.length} Service Instance(s)`;
    } else {
      status = "0 Service Instance";
    }
    return status;
  };

  const VersionCell = (service) => {
    return (
      <StyledTableCell>
        <FormControl style={{ marginLeft: "10px" }} color="primary">
          <Select
            labelId="demo-customized-select-label"
            id="demo-customized-select"
            value={selectedVersions[service.metadata.name]}
            onChange={onSelectVersion.bind(this, service.metadata.name)}
            input={<VersionDropdown />}
            MenuProps={{ classes: { paper: classes.menuPaper } }}
          >
            {service.spec.map((entry) => (
              <MenuItem key={entry.version} value={entry}>
                {entry.version}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </StyledTableCell>
    );
  };

  return (
    <>
      {data.length > 0 &&
        selectedVersions &&
        data.length === Object.keys(selectedVersions).length && (
          <TableContainer component={Paper}>
            <Table className={classes.table} size="small">
              <TableHead>
                <TableRow>
                  <StyledTableCell>Name</StyledTableCell>
                  <StyledTableCell>Description</StyledTableCell>
                  <StyledTableCell>Version</StyledTableCell>
                  <StyledTableCell style={{ width: 150 }}>
                    Actions
                  </StyledTableCell>
                  <StyledTableCell style={{ width: 180 }} align="right">
                    Status
                  </StyledTableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.map((row, index) => (
                  <StyledTableRow key={row.metadata.name + row.spec.version}>
                    <StyledTableCell>
                      <Link
                        to={{
                          pathname: `services/${row.metadata.name}/${
                            selectedVersions[row.metadata.name].version
                          }`,
                        }}
                      >
                        {row.metadata.name}
                      </Link>
                    </StyledTableCell>
                    <StyledTableCell>
                      {row.metadata.description}
                    </StyledTableCell>
                    {VersionCell(row)}
                    <StyledTableCell>
                      <IconButton
                        color="secondary"
                        disabled={
                          getStatus(row.metadata.name) !==
                            "0 Service Instance" &&
                          getStatus(row.metadata.name) !== "Checkout"
                        }
                        onClick={() => {
                          handleDeleteCompositeApp(
                            row.metadata.name,
                            selectedVersions[row.metadata.name].version
                          );
                        }}
                        title="Delete"
                      >
                        <DeleteIcon />
                      </IconButton>
                      {getStatus(row.metadata.name) === "Checkout" && (
                        <IconButton
                          onClick={(e) => onEditCompositeApp(row, index)}
                          title="Edit"
                        >
                          <EditIcon color="primary" />
                        </IconButton>
                      )}
                    </StyledTableCell>
                    <StyledTableCell align="right">
                      {getStatus(row.metadata.name)}
                    </StyledTableCell>
                  </StyledTableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      {(!data || data.length === 0) && (
        <Typography
          variant="h6"
          color="textSecondary"
          className={classes.noRecords}
        >
          No Records To Display
        </Typography>
      )}
    </>
  );
}

const VersionDropdown = withStyles((theme) => ({
  input: {
    borderRadius: 4,
    position: "relative",
    border: "1px solid #ced4da",
    padding: "2px 15px 2px 4px",
    transition: theme.transitions.create(["border-color", "box-shadow"]),
    "&:focus": {
      borderRadius: 4,
      boxShadow: "0 0 0 0.2rem rgba(0,123,255,.25)",
    },
  },
}))(InputBase);

const sortDataByVersion = (a, b) => {
  let versionA = parseInt(a.version.replace("v", ""));
  let versionB = parseInt(b.version.replace("v", ""));
  if (versionA > versionB) return 1;
  else if (versionA < versionB) return -1;
  else return 0;
};

export default withRouter(CustomizedTables);
