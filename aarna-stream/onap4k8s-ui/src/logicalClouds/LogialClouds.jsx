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
import apiService from "../services/apiService";
import Spinner from "../common/Spinner";
import { Button, Grid } from "@material-ui/core";
import LogicalCloudsTable from "./LogicalCloudsTable";
import AddIcon from "@material-ui/icons/Add";
import LogicalCloudForm from "./forms/LogicalCloudForm";
import { ReactComponent as EmptyIcon } from "../assets/icons/empty.svg";
import { Typography } from "@material-ui/core";

const LogicalClouds = ({ projectName, ...props }) => {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [open, setOpen] = React.useState(false);

  useEffect(() => {
    apiService
      .getLogicalClouds(projectName)
      .then((res) => {
        setData(res);
      })
      .catch((err) => {
        console.error("error getting logical clouds", err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [projectName]);

  const handleClose = () => {
    setOpen(false);
  };

  const handleSubmit = (formFields) => {
    let request = { projectName: projectName, payload: formFields };
    apiService
      .createLogicalCloud(request)
      .then((res) => {
        if (!data || data.length === 0) {
          setData([res]);
        } else {
          setData([...data, res]);
        }
      })
      .catch((err) => {
        console.error("error creating logical cloud " + err);
      })
      .finally(() => {
        setOpen(false);
      });
  };

  return (
    <>
      {isLoading && <Spinner />}
      {!isLoading && (
        <>
          <Button
            variant="outlined"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => {
              setOpen(true);
            }}
          >
            Create Logical Cloud
          </Button>
          {open && (
            <LogicalCloudForm
              open={open}
              onClose={handleClose}
              onSubmit={handleSubmit}
            />
          )}

          {data && data.length > 0 && (
            <Grid container spacing={2} alignItems="center">
              <Grid item xs style={{ marginTop: "20px" }}>
                <LogicalCloudsTable
                  data={data}
                  setData={setData}
                  projectName={projectName}
                />
              </Grid>
            </Grid>
          )}

          {(!data || data.length === 0) && (
            <Grid container spacing={2} direction="column" alignItems="center">
              <Grid item xs={6}>
                <EmptyIcon />
              </Grid>
              <Grid item xs={12} style={{ textAlign: "center" }}>
                <Typography variant="h5" color="primary">
                  No Logical Cloud
                </Typography>
                <Typography variant="subtitle1" color="textSecondary">
                  <strong>No logical cloud created yet.</strong>
                </Typography>
              </Grid>
            </Grid>
          )}
        </>
      )}
    </>
  );
};
export default LogicalClouds;
