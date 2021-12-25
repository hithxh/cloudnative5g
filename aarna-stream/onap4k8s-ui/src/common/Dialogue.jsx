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
import Button from "@material-ui/core/Button";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogContentText from "@material-ui/core/DialogContentText";
import DialogTitle from "@material-ui/core/DialogTitle";
import Slide from "@material-ui/core/Slide";
import PropTypes from "prop-types";
import LoadingButton from "./LoadingButton";

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const Dialogue = (props) => {
  const { open, onClose, title, content, confirmationText, loading } = props;
  return (
    <Dialog
      open={open}
      TransitionComponent={Transition}
      keepMounted
      onClose={onClose}
      disableBackdropClick
      fullWidth={props.fullWidth}
      maxWidth={props.maxWidth}
    >
      <DialogTitle id="alert-dialog-slide-title">{title}</DialogTitle>
      <DialogContent>
        {typeof props.content === "string" ? (
          <DialogContentText id="alert-dialog-slide-description">
            {content}
          </DialogContentText>
        ) : (
          content
        )}
      </DialogContent>
      <DialogActions>
        <Button
          onClick={onClose}
          name="cancel"
          color="primary"
          disabled={loading}
        >
          Cancel
        </Button>
        {loading === undefined ? (
          <Button
            onClick={onClose}
            name={confirmationText ? confirmationText.toLowerCase() : "delete"}
            color={
              confirmationText && confirmationText === "OK"
                ? "primary"
                : "secondary"
            }
          >
            {confirmationText ? confirmationText : "Delete"}  
          </Button>
        ) : (
          <LoadingButton
            onClick={onClose}
            buttonLabel={confirmationText ? confirmationText : "OK"}
            loading={loading}
          />
        )}
      </DialogActions>
    </Dialog>
  );
};

Dialogue.propTypes = {
  onClose: PropTypes.func.isRequired,
  open: PropTypes.bool.isRequired,
  content: PropTypes.oneOfType([
    PropTypes.object.isRequired,
    PropTypes.string.isRequired,
  ]),
  title: PropTypes.string.isRequired,
  confirmationText: PropTypes.string,
};

export default Dialogue;
