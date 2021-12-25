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
import FileCopyIcon from "@material-ui/icons/FileCopy";
import CloudUploadIcon from "@material-ui/icons/CloudUpload";
import { makeStyles } from "@material-ui/core";

const useStyles = makeStyles((theme) => ({
  fileUpload: {
    backgroundColor: "#ffffff",
    width: "348",
    marginTop: "10px",
  },
  fileUploadInput: {
    position: "absolute",
    margin: 0,
    padding: 0,
    width: "100%",
    height: "100%",
    outline: "none",
    opacity: 0,
    cursor: "pointer",
  },
  fileUploadWrap: {
    border: "1px dashed rgba(0, 0, 0, 0.25)",
    position: "relative",
    height: "50px",
    "&:hover": {
      border: "1px dashed rgba(0, 0, 0) !important",
    },
  },
  fileUploadText: {
    textAlign: "center",
    "& span": {
      color: "rgba(0, 0, 0, 0.54)",
      display: "block",
    },
  },
}));

const FileUpload = (props) => {
  const classes = useStyles();
  return (
    <>
      <div className={classes.fileUpload}>
        <div
          className={classes.fileUploadWrap}
          style={{
            border:
              props.file &&
              props.file.name &&
              "2px dashed rgba(0, 131, 143, 1)",
          }}
        >
          <input
            required
            className={classes.fileUploadInput}
            type="file"
            accept={props.accept ? props.accept : "*"}
            name="file"
            onBlur={props.handleBlur ? props.handleBlur : null}
            onChange={(event) => {
              props.setFieldValue(props.name, event.currentTarget.files[0]);
            }}
          />

          <div className={classes.fileUploadText}>
            {props.file && props.file.name ? (
              <>
                <span>
                  <FileCopyIcon color="primary" />
                </span>
                <span style={{ fontWeight: 600 }}>{props.file.name}</span>
              </>
            ) : (
              <>
                <span>
                  <CloudUploadIcon />
                </span>
                <span>Drag And Drop or Click To Upload</span>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

FileUpload.propTypes = {
  handleBlur: PropTypes.func,
  setFieldValue: PropTypes.func.isRequired,
};

export default FileUpload;
