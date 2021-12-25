import React, { useState } from "react";
import { makeStyles } from "@material-ui/core/styles";
import clsx from "clsx";
import Card from "@material-ui/core/Card";
import CardHeader from "@material-ui/core/CardHeader";
import CardContent from "@material-ui/core/CardContent";
import Collapse from "@material-ui/core/Collapse";
import IconButton from "@material-ui/core/IconButton";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import StorageIcon from "@material-ui/icons/Storage";
import ErrorIcon from "@material-ui/icons/Error";
import DeleteIcon from "@material-ui/icons/DeleteTwoTone";

const useStyles = makeStyles((theme) => ({
  root: {
    width: "100%",
  },
  expand: {
    transform: "rotate(0deg)",
    marginLeft: "auto",
    transition: theme.transitions.create("transform", {
      duration: theme.transitions.duration.shortest,
    }),
  },
  expandOpen: {
    transform: "rotate(180deg)",
  },
}));
const ExpandableCard = (props) => {
  const classes = useStyles();
  const [expanded, setExpanded] = useState(
    props.expanded ? props.expanded : false
  );

  const handleExpandClick = () => {
    if (!expanded) {
      setExpanded(!expanded);
    } else {
      setExpanded(!expanded);
    }
  };

  return (
    <>
      <Card className={classes.root}>
        <CardHeader
          onClick={handleExpandClick}
          avatar={
            <>
              <StorageIcon fontSize="large" />
            </>
          }
          action={
            <>
              {props.appIndex !== undefined && (
                <IconButton
                  color="primary"
                  onClick={(e) => {
                    e.stopPropagation();
                    props.handleRemoveApp(props.appIndex);
                  }}
                >
                  <DeleteIcon />
                </IconButton>
              )}
              {props.error && (
                <ErrorIcon color="error" style={{ verticalAlign: "middle" }} />
              )}
              <IconButton
                className={clsx(classes.expand, {
                  [classes.expandOpen]: expanded,
                })}
                onClick={handleExpandClick}
                aria-expanded={expanded}
              >
                <ExpandMoreIcon />
              </IconButton>
            </>
          }
          title={props.title}
          subheader={props.description}
        />
        <Collapse in={expanded} timeout="auto" unmountOnExit>
          <CardContent>{props.content}</CardContent>
        </Collapse>
      </Card>
    </>
  );
};

ExpandableCard.propTypes = {};

export default ExpandableCard;
