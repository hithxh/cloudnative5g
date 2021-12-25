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
import {
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Typography,
  makeStyles,
  FormHelperText,
} from "@material-ui/core";
import Button from "@material-ui/core/Button";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogContentText from "@material-ui/core/DialogContentText";
import DialogTitle from "@material-ui/core/DialogTitle";
import JSONInput from "react-json-editor-ajrm/index";
import apiService from "../../../services/apiService";
import Spinner from "../../../common/Spinner";

const useStyles = makeStyles((theme) => ({
  root: {
    flexGrow: 1,
    overflow: "hidden",
  },
  noWorkflowText: {
    textAlign: "center",
  },
  guideBox: {
    textAlign: "center",
    height: "100px",
    background: "black",
    color: "white",
    paddingTop: "35px",
  },
  editorDiv: {
    height: "700px",
  },
}));

export default function ConfigureAppNew({ open, setOpen, ...props }) {
  const [data, setData] = useState({
    getWorkflows: [],
    editWorkflows: [],
    deleteWorkflows: [],
  });
  const [selectedType, setSelectedType] = useState("");
  const [isGetExecuted, setIsGetExecuted] = useState(false);
  const [workflowResponseData, setWorkflowResponseData] = useState(null);
  const [editExecuted, setEditExecuted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [executingWorkflow, setExecutingWorkflow] = useState(false);
  const [executeWorkflowError, setExecuteWorkflowError] = useState(false);
  const [editorSyntaxError, setEditorSyntaxError] = useState(false);
  const [editorContent, setEditorContent] = useState(null);
  const [selectedEditWorkflow, setSelectedEditWorkflow] = useState({
    blueprintName: "",
    blueprintVersion: "",
    actionName: "",
  });
  const [selectedGetWorkflow, setSelectedGetWorkflow] = useState({
    blueprintName: "",
    blueprintVersion: "",
    actionName: "",
  });
  const [selectedDeleteWorkflow, setSelectedDeleteWorkflow] = useState({
    blueprintName: "",
    blueprintVersion: "",
    actionName: "",
  });

  const classes = useStyles();

  const reset = () => {
    setSelectedType("");
    setIsGetExecuted(false);
    setWorkflowResponseData(null);
    setEditorContent(null);
    setSelectedGetWorkflow({
      blueprintName: "",
      blueprintVersion: "",
      actionName: "",
    });
    setSelectedEditWorkflow({
      blueprintName: "",
      blueprintVersion: "",
      actionName: "",
    });
    setSelectedDeleteWorkflow({
      blueprintName: "",
      blueprintVersion: "",
      actionName: "",
    });
    setEditExecuted(false);
    setExecuteWorkflowError(false);
    setEditorSyntaxError(false);
  };

  const setWorkflowData = (responseData) => {
    let workflowData = {
      getWorkflows: [],
      editWorkflows: [],
      deleteWorkflows: [],
    };
    if (
      responseData &&
      typeof responseData !== "string" &&
      responseData.length > 0
    ) {
      responseData.forEach((workflow) => {
        if (workflow.actionType === "Get")
          workflowData.getWorkflows.push(workflow);
        else if (workflow.actionType === "Edit")
          workflowData.editWorkflows.push(workflow);
        else if (workflow.actionType === "Delete")
          workflowData.deleteWorkflows.push(workflow);
      });
    }
    setData(workflowData);
  };
  useEffect(() => {
    setLoading(true);
    let request = {
      compositeAppName: props.compositeAppName,
      appName: props.app.name,
      compositeAppVersion: props.compositeAppVersion,
    };
    if (props.app.name) {
      apiService
        .getAppBlueprintConfig(request)
        .then((getWorkflowRes) => {
          setWorkflowData(getWorkflowRes);
        })
        .catch((err) => {
          console.log(
            `Error getting get workflows for app ${props.app.name}` + err
          );
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [props.compositeAppName, props.compositeAppVersion, props.app.name]);

  const descriptionElementRef = React.useRef(null);
  useEffect(() => {
    if (open) {
      const { current: descriptionElement } = descriptionElementRef;
      if (descriptionElement !== null) {
        descriptionElement.focus();
      }
    }
  }, [open]);

  const handleClose = () => {
    reset();
    setOpen(false);
  };

  const handleExecuteWorkflow = (type) => {
    setExecutingWorkflow(true);
    let request = {};
    if (type === "GET") {
      request = selectedGetWorkflow;
    } else if (type === "EDIT") {
      request = selectedEditWorkflow;
      request.payload = editorContent;
    } else if (type === "DELETE") {
      request = selectedDeleteWorkflow;
      request.type = type;
    }

    apiService
      .executeWorkflow(request)
      .then((res) => {
        if (type === "EDIT") setEditExecuted(true);
        if (type === "GET") setWorkflowResponseData(res);
        if (selectedType === "EDIT") {
          setIsGetExecuted(true);
        }
      })
      .catch((err) => {
        console.log(`error executing ${type} workflow ${err}`);
        setExecuteWorkflowError(true);
      })
      .finally(() => {
        setExecutingWorkflow(false);
      });
  };

  const handleSelectGetWorkflow = (e) => {
    setSelectedGetWorkflow(e.target.value);
    setIsGetExecuted(false);
    setWorkflowResponseData(null);
    setEditExecuted(false);
  };

  const handleSelectEditWorkflow = (e) => {
    setSelectedEditWorkflow(e.target.value);
  };

  const handleSelectDeleteWorkflow = (e) => {
    setSelectedDeleteWorkflow(e.target.value);
  };
  const handleChangeWorkflowType = (event) => {
    reset();
    setSelectedType(event.target.value);
  };
  const handleEditorChange = (editorValues) => {
    if (editorValues.error) {
      setEditorSyntaxError(true);
    } else {
      setEditorSyntaxError(false);
      setEditorContent(editorValues.jsObject);
      setEditExecuted(false);
    }
  };
  return (
    <Dialog
      open={open}
      fullWidth
      maxWidth={"lg"}
      onClose={handleClose}
      scroll={"paper"}
      disableBackdropClick
    >
      <DialogTitle id="scroll-dialog-title">Run Configuration</DialogTitle>
      <DialogContent dividers>
        {!loading &&
          data.editWorkflows.length < 1 &&
          data.getWorkflows.length < 1 &&
          data.deleteWorkflows.length < 1 && (
            <Typography variant="h6" className={classes.noWorkflowText}>
              No workflow available for this app
            </Typography>
          )}
        {!executeWorkflowError && editExecuted && (
          <DialogContentText
            id="scroll-dialog-description"
            ref={descriptionElementRef}
            tabIndex={-1}
            style={{ color: "green" }}
          >
            Configuration updated
          </DialogContentText>
        )}
        {executeWorkflowError && (
          <DialogContentText
            id="scroll-dialog-description"
            ref={descriptionElementRef}
            tabIndex={-1}
            color="error"
          >
            Error executing workflow
          </DialogContentText>
        )}
        {(data.editWorkflows.length > 0 ||
          data.getWorkflows.length > 0 ||
          data.deleteWorkflows.length > 0) &&
        open &&
        !loading ? (
          <form noValidate>
            <Grid container className={classes.root}>
              <Grid item xs={6}>
                <Grid container spacing={6} justify="center">
                  <Grid container item spacing={4} xs={12}>
                    <Grid item xs={8}>
                      <FormControl fullWidth required>
                        <InputLabel htmlFor="workflowType-label-placeholder">
                          Select Workflow Type
                        </InputLabel>
                        <Select
                          fullWidth
                          name="workflowType"
                          value={selectedType}
                          onChange={handleChangeWorkflowType}
                          inputProps={{
                            name: "workflowType",
                            id: "workflowType-label-placeholder",
                          }}
                        >
                          {["GET", "EDIT", "DELETE"].map((val) => (
                            <MenuItem
                              disabled={
                                (val === "EDIT" &&
                                  data.editWorkflows.length < 1) ||
                                (val === "GET" &&
                                  data.getWorkflows.length < 1) ||
                                (val === "DELETE" &&
                                  data.deleteWorkflows.length < 1)
                              }
                              value={val}
                              key={val}
                            >
                              {val}
                            </MenuItem>
                          ))}
                        </Select>
                        {selectedType === "EDIT" && (
                          <FormHelperText>
                            First execute a get workflow to get the current
                            configuration, then edit the configuration in the
                            left hand side editor and then execute an edit
                            workflow to update the edited configuration.
                          </FormHelperText>
                        )}
                      </FormControl>
                    </Grid>
                  </Grid>

                  {selectedType &&
                    (selectedType === "GET" || selectedType === "EDIT") && (
                      <Grid container item xs={12} spacing={4}>
                        <Grid item xs={8}>
                          <FormControl fullWidth required>
                            <InputLabel htmlFor="getWorkflow-label-placeholder">
                              Select GET Workflow
                            </InputLabel>
                            <Select
                              fullWidth
                              name="getWorkflow"
                              value={selectedGetWorkflow}
                              onChange={handleSelectGetWorkflow}
                              inputProps={{
                                name: "getWorkflow",
                                id: "getWorkflow-label-placeholder",
                              }}
                            >
                              {data &&
                                data.getWorkflows.map((wf) => (
                                  <MenuItem value={wf} key={wf.actionName}>
                                    {wf.actionName}
                                  </MenuItem>
                                ))}
                            </Select>
                          </FormControl>
                        </Grid>
                        <Grid item xs={4}>
                          <Button
                            disabled={
                              workflowResponseData !== null ||
                              !selectedGetWorkflow.actionName ||
                              executingWorkflow
                            }
                            onClick={() => {
                              handleExecuteWorkflow("GET");
                            }}
                            color="primary"
                          >
                            Execute
                          </Button>
                        </Grid>
                      </Grid>
                    )}

                  {selectedType && selectedType === "EDIT" && (
                    <Grid container spacing={4} item xs={12}>
                      <Grid item xs={8}>
                        <FormControl fullWidth required>
                          <InputLabel htmlFor="editWorkflow-label-placeholder">
                            Select Edit Workflow
                          </InputLabel>
                          <Select
                            disabled={!isGetExecuted}
                            fullWidth
                            value={selectedEditWorkflow}
                            onChange={handleSelectEditWorkflow}
                            name="editWorkflow"
                            inputProps={{
                              name: "editWorkflow",
                              id: "editWorkflow-label-placeholder",
                            }}
                          >
                            {data &&
                              data.editWorkflows.map((wf) => (
                                <MenuItem value={wf} key={wf.actionName}>
                                  {wf.actionName}
                                </MenuItem>
                              ))}
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid item xs={2}>
                        <Button
                          disabled={
                            !isGetExecuted ||
                            !selectedEditWorkflow.actionName ||
                            editExecuted ||
                            executingWorkflow ||
                            editorSyntaxError ||
                            !editorContent
                          }
                          autoFocus
                          color="primary"
                          onClick={() => {
                            handleExecuteWorkflow("EDIT");
                          }}
                        >
                          Execute
                        </Button>
                      </Grid>
                    </Grid>
                  )}

                  {selectedType && selectedType === "DELETE" && (
                    <Grid container item xs={12} spacing={4}>
                      <Grid item xs={8}>
                        <FormControl fullWidth required>
                          <InputLabel htmlFor="deleteWorkflow-label-placeholder">
                            Select DELETE Workflow
                          </InputLabel>
                          <Select
                            fullWidth
                            name="deleteWorkflow"
                            value={selectedDeleteWorkflow}
                            onChange={handleSelectDeleteWorkflow}
                            inputProps={{
                              name: "deleteWorkflow",
                              id: "deleteWorkflow-label-placeholder",
                            }}
                          >
                            {data &&
                              data.deleteWorkflows.map((wf) => (
                                <MenuItem value={wf} key={wf.actionName}>
                                  {wf.actionName}
                                </MenuItem>
                              ))}
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid item xs={4}>
                        <Button
                          disabled={
                            !selectedDeleteWorkflow || executingWorkflow
                          }
                          onClick={() => {
                            handleExecuteWorkflow("DELETE");
                          }}
                          color="primary"
                        >
                          Execute
                        </Button>
                      </Grid>
                    </Grid>
                  )}
                </Grid>
              </Grid>

              <Grid item container justify="center" spacing={6} xs={6}>
                <Grid item xs={12}>
                  <div className={classes.editorDiv}>
                    {workflowResponseData ? (
                      <JSONInput
                        placeholder={workflowResponseData}
                        theme="dark"
                        viewOnly={selectedType && selectedType === "GET"}
                        colors={{
                          string: "#DAA520",
                        }}
                        height="100%"
                        width="550px"
                        onChange={(values) => {
                          handleEditorChange(values);
                        }}
                      />
                    ) : (
                      <div className={classes.guideBox}>
                        <Typography>
                          {!selectedType
                            ? "Select a workflow type"
                            : !selectedGetWorkflow
                            ? "Select a workflow"
                            : "Execute workflow to get data"}
                        </Typography>
                      </div>
                    )}
                  </div>
                </Grid>
              </Grid>
            </Grid>
          </form>
        ) : (
          loading && <Spinner />
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} color="primary">
          OK
        </Button>
      </DialogActions>
    </Dialog>
  );
}
