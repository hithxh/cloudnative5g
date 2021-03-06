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
import React from "react";
import PropTypes from "prop-types";
import { ThemeProvider, withStyles } from "@material-ui/core/styles";
import CssBaseline from "@material-ui/core/CssBaseline";
import Hidden from "@material-ui/core/Hidden";
import Navigator from "../common/Navigator";
import Header from "./Header";
import CompositeApps from "../compositeApps/CompositeApps";
import CompositeApp from "../compositeApps/CompositeApp";
import theme from "../theme/Theme";
import DeploymentIntentGroups from "../deploymentIntentGroups/DeploymentIntentGroups";
import { Switch, Route } from "react-router-dom";
import DeploymentIntentGroup from "../deploymentIntentGroups/digView/DeploymentIntentGroup";
import DeploymentIntentGroupCheckout from "../deploymentIntentGroups/digView/DeploymentIntentGroupCheckout";
import Dashboard from "../dashboard/DashboardView";
import { tanentMenu } from "../config/uiConfig";
import PageNotFound from "../common/PageNotFound";
import LogicalClouds from "../logicalClouds/LogialClouds";

const drawerWidth = 256;
const styles = {
  root: {
    display: "flex",
    minHeight: "100vh",
  },
  drawer: {
    [theme.breakpoints.up("sm")]: {
      width: drawerWidth,
      flexShrink: 0,
    },
  },
  app: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
  },
  main: {
    flex: 1,
    padding: theme.spacing(3, 4, 6, 4),
    background: "#eaeff1",
  },
  footer: {
    background: "#eaeff1",
  },
};

class AppBase extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      projectName: props.match.params.projectName,
      mobileOpen: false,
    };
  }

  setMobileOpen = (mobileOpen) => {
    this.setState({ mobileOpen });
  };
  handleDrawerToggle = () => {
    this.setMobileOpen(!this.state.mobileOpen);
  };

  render() {
    const { classes } = this.props;
    return (
      <>
        {this.state.projectName && (
          <ThemeProvider theme={theme}>
            <div className={classes.root}>
              <CssBaseline />
              <nav className={classes.drawer}>
                <Hidden smUp implementation="js">
                  <Navigator
                    PaperProps={{ style: { width: drawerWidth } }}
                    variant="temporary"
                    open={this.state.mobileOpen}
                    onClose={this.handleDrawerToggle}
                    menu={tanentMenu}
                  />
                </Hidden>
                <Hidden xsDown implementation="css">
                  <Navigator
                    PaperProps={{ style: { width: drawerWidth } }}
                    variant="permanent"
                    menu={tanentMenu}
                  />
                </Hidden>
              </nav>
              <div className={classes.app}>
                <Header onDrawerToggle={this.handleDrawerToggle} />
                <main className={classes.main}>
                  <Switch>
                    <Route
                      exact
                      path={`${this.props.match.url}/404`}
                      component={() => <PageNotFound />}
                    />
                    <Route exact path={`${this.props.match.url}/dashboard`}>
                      <Dashboard projectName={this.state.projectName} />
                    </Route>
                    <Route exact path={`${this.props.match.url}/services`}>
                      <CompositeApps projectName={this.state.projectName} />
                    </Route>
                    <Route
                      exact
                      path={`${this.props.match.url}/logical-clouds`}
                    >
                      <LogicalClouds projectName={this.state.projectName} />
                    </Route>
                    <Route
                      exact
                      path={`${this.props.match.url}/services/:appname/:version`}
                      component={() => (
                        <CompositeApp projectName={this.state.projectName} />
                      )}
                    ></Route>
                    <Route
                      exact
                      path={`${this.props.match.url}/deployment-intent-groups`}
                    >
                      <DeploymentIntentGroups
                        projectName={this.state.projectName}
                      />
                    </Route>
                    <Route
                      exact
                      path={`${this.props.match.url}/deployment-intent-groups/:compositeAppName/:compositeAppVersion/:digName/status`}
                    >
                      <DeploymentIntentGroup
                        projectName={this.state.projectName}
                      />
                    </Route>
                    <Route
                      exact
                      path={`${this.props.match.url}/deployment-intent-groups/:compositeAppName/:compositeAppVersion/:digName/checkout`}
                    >
                      <DeploymentIntentGroupCheckout
                        projectName={this.state.projectName}
                      />
                    </Route>
                    <Route path="/" component={() => <PageNotFound />} />
                  </Switch>
                </main>
              </div>
            </div>
          </ThemeProvider>
        )}
      </>
    );
  }
}

AppBase.propTypes = {
  classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(AppBase);
