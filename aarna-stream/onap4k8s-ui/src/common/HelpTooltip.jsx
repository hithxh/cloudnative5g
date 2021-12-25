import React from "react";
import PropTypes from "prop-types";
import HelpIcon from "@material-ui/icons/Help";
import Tooltip from "@material-ui/core/Tooltip";
import { makeStyles } from "@material-ui/core";

const useStyles = makeStyles((theme) => ({
  icon: {
    marginLeft: theme.spacing(1),
    fontSize: "1rem",
    color: "#808080a6",
  },
}));

const HelpTooltip = ({ message }) => {
  const classes = useStyles();
  return (
    message && (
      <Tooltip placement="top" arrow title={message} aria-label={message}>
        <HelpIcon className={classes.icon} />
      </Tooltip>
    )
  );
};

HelpTooltip.prototype = {
  message: PropTypes.string.isRequired,
};

export default HelpTooltip;
