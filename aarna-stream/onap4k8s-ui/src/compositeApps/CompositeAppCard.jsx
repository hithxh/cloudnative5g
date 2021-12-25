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
import clsx from "clsx";
import {
  Grid,
  Typography,
  makeStyles,
  Card,
  CardHeader,
  IconButton,
  CardActions,
  FormControl,
  Select,
  MenuItem,
  withStyles,
  InputBase,
} from "@material-ui/core";
import DeleteIcon from "@material-ui/icons/DeleteTwoTone";
import EditIcon from "@material-ui/icons/BorderColorRounded";
import { withRouter } from "react-router";
import { Link } from "react-router-dom";

const useStyles = makeStyles((theme) => ({
  root: {},
  card: {
    width: "300px",
  },
  status: { padding: "10px", float: "right" },
  textEllipsis: {
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  divider: {
    borderLeft: `2px solid ${theme.palette.grey[300]} `,
    display: "inline-flex",
    height: "18px",
    marginLeft: "8px",
    verticalAlign: "middle",
  },
  serviceVersion: {
    display: "inline-flex",
    marginLeft: "8px",
    width: "24px",
    verticalAlign: "middle",
  },
  serviceName: {
    maxWidth: "204px",
    float: "left",
    cursor: "pointer",
    "& a": {
      color: "inherit",
      textDecoration: "none",
      cursor: "pointer",
    },
    "& a:hover": {
      textDecoration: "underline",
    },
  },
  serviceDescription: {
    width: "260px",
  },
  noRecords: {
    marginTop: "20px",
    padding: "10px",
    textAlign: "center",
    "& h6": { backgroundColor: theme.palette.action.hover },
  },
}));

const CompositeAppCard = ({ handleDeleteCompositeApp, data, ...props }) => {
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
      status = `${selectedVersions[appName].deploymentIntentGroups.length} instance(s)`;
    } else {
      status = "0 instance";
    }
    return status;
  };
  return (
    <>
      <Grid
        style={{ padding: "8px" }}
        container
        justify="flex-start"
        spacing={4}
      >
        {data &&
          selectedVersions &&
          data.map((service, index) => (
            <Grid key={service.metadata.name} item>
              <Card className={classes.card}>
                <div className={classes.status}>
                  {getStatus(service.metadata.name) === "Checkout" ? (
                    <IconButton
                      onClick={(e) => onEditCompositeApp(service, index)}
                      title="Edit"
                    >
                      <EditIcon color="primary" />
                    </IconButton>
                  ) : (
                    <div>&nbsp;</div>
                  )}
                </div>

                <CardHeader
                  title={
                    <>
                      <Typography
                        className={classes.title}
                        color="textSecondary"
                        gutterBottom
                      >
                        {getStatus(service.metadata.name)}
                      </Typography>
                      <Typography
                        color="primary"
                        variant="h6"
                        title={service.metadata.name}
                        className={clsx(
                          classes.textEllipsis,
                          classes.serviceName
                        )}
                      >
                        <Link
                          to={{
                            pathname: `services/${service.metadata.name}/${
                              selectedVersions[service.metadata.name].version
                            }`,
                          }}
                        >
                          {service.metadata.name}
                        </Link>
                      </Typography>
                      <div className={classes.divider}></div>
                      <FormControl
                        style={{ marginLeft: "10px", verticalAlign: "middle" }}
                        color="primary"
                      >
                        <Select
                          labelId="demo-customized-select-label"
                          id="demo-customized-select"
                          value={selectedVersions[service.metadata.name]}
                          onChange={onSelectVersion.bind(
                            this,
                            service.metadata.name
                          )}
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
                    </>
                  }
                  subheader={
                    <Typography
                      variant="body1"
                      color="textSecondary"
                      title={service.metadata.description}
                      className={clsx(
                        classes.textEllipsis,
                        classes.serviceDescription
                      )}
                    >
                      {service.metadata.description}&nbsp;
                    </Typography>
                  }
                />

                <CardActions style={{ float: "right" }}>
                  <IconButton
                    color="secondary"
                    disabled={
                      getStatus(service.metadata.name) !== "0 instance" &&
                      getStatus(service.metadata.name) !== "Checkout"
                    }
                    onClick={() => {
                      handleDeleteCompositeApp(
                        service.metadata.name,
                        selectedVersions[service.metadata.name].version
                      );
                    }}
                  >
                    <DeleteIcon />
                  </IconButton>
                </CardActions>
              </Card>
            </Grid>
          ))}
      </Grid>

      {(!data || data.length === 0) && (
        <div className={classes.noRecords}>
          <Typography variant="h6" color="textSecondary">
            No Records To Display
          </Typography>
        </div>
      )}
    </>
  );
};

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
  let versionA = a.version.toLowerCase();
  let versionB = b.version.toLowerCase();
  if (versionA > versionB) return 1;
  else if (versionA < versionB) return -1;
  else return 0;
};

export default withRouter(CompositeAppCard);
