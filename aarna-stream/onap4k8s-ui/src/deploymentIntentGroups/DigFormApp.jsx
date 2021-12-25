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
import { makeStyles } from "@material-ui/core/styles";
import PropTypes from "prop-types";
import Tabs from "@material-ui/core/Tabs";
import Tab from "@material-ui/core/Tab";
import Box from "@material-ui/core/Box";
import React, { useState } from "react";
import Typography from "@material-ui/core/Typography";
import ExpandableCard from "../common/ExpandableCard";
import AppPlacementForm from "../compositeApps/forms/AppFormPlacement";
import NetworkForm from "../compositeApps/forms/AppNetworkForm";
import { TextField } from "@material-ui/core";
import HelpTooltip from "../common/HelpTooltip";

const useStyles = makeStyles((theme) => ({
  tableRoot: {
    width: "100%",
  },
  paper: {
    width: "100%",
    marginBottom: theme.spacing(2),
  },
  table: {
    minWidth: 550,
  },
  appBar: {
    position: "relative",
  },
  title: {
    marginLeft: theme.spacing(2),
    flex: 1,
  },
  demo: {
    backgroundColor: theme.palette.background.paper,
  },
  root: {
    flexGrow: 1,
    backgroundColor: theme.palette.background.paper,
    display: "flex",
    height: 424,
  },
  tabs: {
    borderRight: `1px solid ${theme.palette.divider}`,
  },
  tabHeader: {
    marginBottom: "20px",
  },
}));
function TabPanel(props) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`vertical-tabpanel-${index}`}
      aria-labelledby={`vertical-tab-${index}`}
      {...other}
    >
      {value === index && <Box style={{ padding: "0 24px" }}>{children}</Box>}
    </div>
  );
}

const OverrideForm = ({ formikProps, index, ...props }) => {
  return (
    <TextField
      fullWidth
      label="Override Fields"
      name={`apps[${index}].overrideValues`}
      type="text"
      value={formikProps.values.apps[index].overrideValues}
      onChange={formikProps.handleChange}
      onBlur={formikProps.handleBlur}
      multiline
      rows={4}
      variant="outlined"
      error={
        formikProps.errors.apps &&
        formikProps.errors.apps[index] &&
        formikProps.errors.apps[index].overrideValues &&
        true
      }
      helperText={
        formikProps.errors.apps &&
        formikProps.errors.apps[index] &&
        formikProps.errors.apps[index].overrideValues
      }
    />
  );
};

function AppDetailsForm({ formikProps, ...props }) {
  const classes = useStyles();
  const [value, setValue] = useState(0);
  const handleChange = (event, newValue) => {
    setValue(newValue);
  };
  //let the default type be labels if not present
  const [type, setType] = React.useState(
    props.initialValues.apps[props.index].placementType || "labels"
  );

  const handleRowSelect = (clusterProvider, selectedRows) => {
    if (!formikProps.values.apps[props.index].clusters) {
      if (selectedRows.length > 0) {
        let selectedRowData = [];

        //set formik fields based on the placement type
        if (type === "clusters") {
          selectedRows.forEach((selectedCluster) => {
            selectedRowData.push({ name: selectedCluster });
          });
          formikProps.setFieldValue(`apps[${props.index}].clusters`, [
            {
              clusterProvider: clusterProvider,
              selectedClusters: selectedRowData,
            },
          ]);
        } else {
          selectedRows.forEach((selectedCluster) => {
            selectedRowData.push({ "label-name": selectedCluster });
          });
          formikProps.setFieldValue(`apps[${props.index}].clusters`, [
            {
              clusterProvider: clusterProvider,
              selectedLabels: selectedRowData,
            },
          ]);
        }
      }
    } else {
      let selectedRowData = [];
      //filter out the value of cluster provider so that it can be completely replaced by the new values
      let updatedClusterValues = formikProps.values.apps[
        props.index
      ].clusters.filter(
        (cluster) => cluster.clusterProvider !== clusterProvider
      );

      if (selectedRows.length > 0) {
        if (type === "clusters") {
          selectedRows.forEach((selectedCluster) => {
            selectedRowData.push({ name: selectedCluster });
          });
          updatedClusterValues.push({
            clusterProvider: clusterProvider,
            selectedClusters: selectedRowData,
          });
        } else {
          selectedRows.forEach((selectedCluster) => {
            selectedRowData.push({ "label-name": selectedCluster });
          });
          updatedClusterValues.push({
            clusterProvider: clusterProvider,
            selectedLabels: selectedRowData,
          });
        }
      }
      formikProps.setFieldValue(
        `apps[${props.index}].clusters`,
        updatedClusterValues
      );
    }
  };
  return (
    <div className={classes.root}>
      <Tabs
        orientation="vertical"
        variant="scrollable"
        value={value}
        onChange={handleChange}
        aria-label="Vertical tabs example"
        className={classes.tabs}
      >
        <Tab label="Placement" {...a11yProps(1)} />
        <Tab label="Network" {...a11yProps(2)} />
        <Tab label="Override" {...a11yProps(3)} />
      </Tabs>
      <TabPanel style={{ width: "85%" }} value={value} index={0}>
        <AppPlacementForm
          formikProps={formikProps}
          index={props.index}
          logicalCloud={props.logicalCloud}
          handleRowSelect={handleRowSelect}
          type={type}
          setType={setType}
        />
      </TabPanel>
      <TabPanel style={{ width: "85%" }} value={value} index={1}>
        <Typography className={classes.tabHeader} variant="subtitle1">
          Select Network
        </Typography>
        <NetworkForm
          clusters={formikProps.values.apps[props.index].clusters}
          formikProps={formikProps}
          index={props.index}
          interfaces={formikProps.values.apps[props.index].interfaces}
          placementType={type}
        />
      </TabPanel>
      <TabPanel style={{ width: "85%" }} value={value} index={2}>
        <Typography className={classes.tabHeader} variant="subtitle1">
          Override Fields
          <HelpTooltip
            message='Enter override fields for this app. Fields should be a valid JSON and should include app name and values, e.g {"app-name":"<app-name>",
"values":{<override json >}}'
          />
        </Typography>
        <OverrideForm formikProps={formikProps} index={props.index} />
      </TabPanel>
    </div>
  );
}

TabPanel.propTypes = {
  children: PropTypes.node,
  index: PropTypes.any.isRequired,
  value: PropTypes.any.isRequired,
};

function a11yProps(index) {
  return {
    id: `vertical-tab-${index}`,
    "aria-controls": `vertical-tabpanel-${index}`,
  };
}

const AppForm2 = (props) => {
  return (
    <ExpandableCard
      expanded={props.expanded}
      error={
        props.formikProps.errors.apps &&
        props.formikProps.errors.apps[props.index]
      }
      title={props.name}
      description={props.description}
      content={
        <AppDetailsForm
          formikProps={props.formikProps}
          name={props.name}
          index={props.index}
          logicalCloud={props.logicalCloud}
          initialValues={props.initialValues}
        />
      }
    />
  );
};
export default AppForm2;
