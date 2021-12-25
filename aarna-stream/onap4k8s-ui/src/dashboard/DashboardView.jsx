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
import serviceInstanceIcon from "../assets/icons/serviceInstanceIcon.png";
import serviceIcon from "../assets/icons/serviceIcon.png";
import clusterIcon from "../assets/icons/clusterIcon.png";
import Spinner from "../common/Spinner";
import apiService from "../services/apiService";
import { Card, Grid, makeStyles, Typography } from "@material-ui/core";

const useStyles = makeStyles((theme) => ({
  iconContainer: { height: "89px", margin: "1em 0" },
  cardRoot: {
    width: "80%",
    display: "flex",
    flexDirection: "column",
    padding: "16px",
  },
  info: {
    paddingRight: "20px !important",
    textAlign: "right",
  },
}));

function DashboardView({ projectName, ...props }) {
  const [dashboardData, setDashboardData] = useState(null);
  const [isLoading, setIsloading] = useState(true);
  const classes = useStyles();
  useEffect(() => {
    apiService
      .getDashboardData(projectName)
      .then((res) => {
        setDashboardData(res);
      })
      .finally(() => {
        setIsloading(false);
      });
  }, [projectName]);

  return (
    <>
      {isLoading && <Spinner />}
      {!isLoading && dashboardData && (
        <Grid container spacing={4}>
          <Grid item xs={12} md={8} lg={4}>
            <Card className={classes.cardRoot}>
              <Grid container spacing={3}>
                <Grid item xs={6} className={classes.iconContainer}>
                  <img
                    style={{ height: "100%" }}
                    src={serviceIcon}
                    alt="serviceIcon"
                  />
                </Grid>
                <Grid item xs={6} className={classes.info}>
                  <Typography variant="body1" color="textSecondary">
                    {dashboardData.composite_app_count > 1
                      ? "Services"
                      : "Service"}
                  </Typography>
                  <Typography component="h2" variant="h2" color="primary">
                    {dashboardData.composite_app_count}
                  </Typography>
                </Grid>
              </Grid>
            </Card>
          </Grid>

          <Grid item xs={12} md={8} lg={4}>
            <Card className={classes.cardRoot}>
              <Grid container spacing={3}>
                <Grid item xs={6} className={classes.iconContainer}>
                  <img
                    style={{ height: "100%" }}
                    src={serviceInstanceIcon}
                    alt="serviceInstanceIcon"
                  />
                </Grid>
                <Grid item xs={6} className={classes.info}>
                  <Typography variant="body1" color="textSecondary">
                    {dashboardData.deployment_intent_group_count > 1
                      ? "Service Instances"
                      : "Service Instance"}
                  </Typography>
                  <Typography component="h2" variant="h2" color="primary">
                    {dashboardData.deployment_intent_group_count}
                  </Typography>
                </Grid>
              </Grid>
            </Card>
          </Grid>

          <Grid item xs={12} md={8} lg={4}>
            <Card className={classes.cardRoot}>
              <Grid container spacing={3}>
                <Grid item xs={6} className={classes.iconContainer}>
                  <img
                    style={{ maxHeight: "100%" }}
                    src={clusterIcon}
                    alt="clusterIcon"
                  />
                </Grid>
                <Grid item xs={6} className={classes.info}>
                  <Typography variant="body1" color="textSecondary">
                    {dashboardData.cluster_count > 1 ? "Clusters" : "Cluster"}
                  </Typography>
                  <Typography component="h2" variant="h2" color="primary">
                    {dashboardData.cluster_count}
                  </Typography>
                </Grid>
              </Grid>
            </Card>
          </Grid>
        </Grid>
      )}
    </>
  );
}
export default DashboardView;
