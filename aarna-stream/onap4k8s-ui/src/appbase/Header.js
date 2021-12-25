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
import AppBar from "@material-ui/core/AppBar";
import Hidden from "@material-ui/core/Hidden";
import MenuIcon from "@material-ui/icons/Menu";
import Toolbar from "@material-ui/core/Toolbar";
import { withStyles } from "@material-ui/core/styles";
import { withRouter } from "react-router-dom";
import { Typography, Grid, IconButton } from "@material-ui/core";
import Breadcrumbs from "@material-ui/core/Breadcrumbs";
import NavigateNextIcon from "@material-ui/icons/NavigateNext";

const lightColor = "rgba(255, 255, 255, 0.7)";

const styles = (theme) => ({
  root: {
    boxShadow:
      "0 3px 4px 0 rgba(0,0,0,.2), 0 3px 3px -2px rgba(0,0,0,.14), 0 1px 8px 0 rgba(0,0,0,.12)",
  },
  secondaryBar: {
    zIndex: 0,
  },
  menuButton: {
    marginLeft: -theme.spacing(1),
  },
  iconButtonAvatar: {
    padding: 4,
  },
  link: {
    textDecoration: "none",
    color: lightColor,
    "&:hover": {
      color: theme.palette.common.white,
    },
  },
  button: {
    borderColor: lightColor,
  },
});

function Header(props) {
  const { classes, onDrawerToggle, location } = props;

  // let headerName = "";
  // let setHeaderName = () => {
  //   if (location.pathname === `${props.match.url}/dashboard`) {
  //     headerName = <Typography>Dashboard</Typography>;
  //   } else if (location.pathname === `${props.match.url}/services`) {
  //     headerName = <Typography>Services</Typography>;
  //   } else if (
  //     location.pathname === `${props.match.url}/deployment-intent-groups`
  //   ) {
  //     headerName = <Typography>Service Instances</Typography>;
  //   } else if (location.pathname.includes("services")) {
  //     headerName = (
  //       <Typography>
  //         services/
  //         {location.pathname
  //           .slice(location.pathname.indexOf("services"))
  //           .slice(9)}
  //       </Typography>
  //     );
  //   } else if (location.pathname === `${props.match.url}/projects`) {
  //     headerName = <Typography>Tenants</Typography>;
  //   } else if (location.pathname === `${props.match.url}/clusters`) {
  //     headerName = <Typography>Clusters</Typography>;
  //   } else if (location.pathname === `${props.match.url}/controllers`) {
  //     headerName = <Typography>Controllers</Typography>;
  //   } else if (location.pathname.includes("deployment-intent-groups")) {
  //     headerName = (
  //       <>
  //         <Grid item>
  //           <BackIcon
  //             style={{ color: "#fff", cursor: "pointer", marginRight: "5px" }}
  //             onClick={props.history.goBack}
  //           ></BackIcon>
  //         </Grid>
  //         <Grid item>
  //           <Typography>Service Instance Detail</Typography>
  //         </Grid>
  //       </>
  //     );
  //   }
  // };

  let breadcrumbs = [];

  let getHeaderName = () => {
    if (location.pathname === `${props.match.url}/projects`) {
      breadcrumbs.push({ name: "Tenants", path: "#" });
    } else if (location.pathname === `${props.match.url}/clusters`) {
      breadcrumbs.push({ name: "Clusters", path: "#" });
    } else if (location.pathname === `${props.match.url}/controllers`) {
      breadcrumbs.push({ name: "Controllers", path: "#" });
    } else if (location.pathname === `${props.match.url}/dashboard`) {
      breadcrumbs.push({ name: "Dashboard", path: "/dashboard" });
    } else if (location.pathname === `${props.match.url}/services`) {
      breadcrumbs.push({ name: "Services", path: "/services" });
    } else if (
      location.pathname ===
      `${props.match.url}/services/${props.match.params.appname}/${props.match.params.version}`
    ) {
      breadcrumbs.push({ name: "some", path: "/services" });
    } else if (
      location.pathname === `${props.match.url}/deployment-intent-groups`
    ) {
      breadcrumbs.push({ name: "Service Instances", path: "/services" });
    } else if (location.pathname.includes("services")) {
      var serviceNameWithVersion = location.pathname
        .slice(location.pathname.indexOf("services"))
        .slice(9);
      breadcrumbs.push({ name: "Services", path: "/services" });
      breadcrumbs.push({
        name: serviceNameWithVersion.slice(
          0,
          serviceNameWithVersion.indexOf("/")
        ),
        path: "/services",
      });
    } else if (location.pathname.includes("deployment-intent-groups")) {
      // headerName = (
      //   <>
      //     <Grid item>
      //       <BackIcon
      //         style={{ color: "#fff", cursor: "pointer", marginRight: "5px" }}
      //         onClick={props.history.goBack}
      //       ></BackIcon>
      //     </Grid>
      //     <Grid item>
      //       <Typography>Service Instance Detail</Typography>
      //     </Grid>
      //   </>
      // );
      breadcrumbs.push({ name: "Service Instances", path: "#" });
      breadcrumbs.push({ name: "Service Instance Detail", path: "#" });
    } else if (location.pathname === `${props.match.url}/logical-clouds`) {
      breadcrumbs.push({ name: "Logical Clouds", path: "/logical-clouds" });
    }
  };

  // setHeaderName();
  getHeaderName();
  //set website title to current page
  breadcrumbs.forEach((breadcrumb, index) => {
    if (index === 0) {
      document.title = breadcrumb.name;
    } else {
      document.title = document.title + " - " + breadcrumb.name;
    }
  });

  // function handleClick(event) {
  //   event.preventDefault();
  //   console.info("You clicked a breadcrumb.");
  // }

  return (
    <React.Fragment>
      {/* <AppBar
        className={classes.root}
        color="primary"
        position="sticky"
        elevation={0}
      >
        <Toolbar>
          <Grid container spacing={1} alignItems="center">
            <Hidden smUp implementation="js">
              <Grid item>
                <IconButton
                  color="inherit"
                  onClick={onDrawerToggle}
                  className={classes.menuButton}
                >
                  <MenuIcon />
                </IconButton>
              </Grid>
            </Hidden>
            <Grid item container>
              {headerName}
            </Grid>
          </Grid>
        </Toolbar>
      </AppBar> */}

      <AppBar
        className={classes.root}
        color="primary"
        position="sticky"
        elevation={0}
      >
        <Toolbar>
          <Grid container spacing={1} alignItems="center">
            <Hidden smUp implementation="js">
              <Grid item>
                <IconButton
                  color="inherit"
                  onClick={onDrawerToggle}
                  className={classes.menuButton}
                >
                  <MenuIcon />
                </IconButton>
              </Grid>
            </Hidden>
            <Grid item container>
              <Breadcrumbs
                color="inherit"
                separator={<NavigateNextIcon fontSize="small" />}
                aria-label="breadcrumb"
              >
                {breadcrumbs.map((breadcrumb, index) => (
                  <Typography
                    key={breadcrumb.name + index}
                    color="inherit"
                    href="/"
                    // onClick={handleClick}
                  >
                    {breadcrumb.name}
                  </Typography>
                ))}
                {/* <Link color="inherit" href="/" onClick={handleClick}>
                  {headerName}
                </Link>
                <Link
                  color="inherit"
                  href="/getting-started/installation/"
                  onClick={handleClick}
                >
                  Core
                </Link> */}
              </Breadcrumbs>
            </Grid>
          </Grid>
        </Toolbar>
      </AppBar>
    </React.Fragment>
  );
}

Header.propTypes = {
  classes: PropTypes.object.isRequired,
  onDrawerToggle: PropTypes.func.isRequired,
};

export default withStyles(styles)(withRouter(Header));
