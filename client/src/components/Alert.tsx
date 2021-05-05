import React from 'react';
import { Snackbar, SnackbarCloseReason } from '@material-ui/core';
import MuiAlert, { Color } from '@material-ui/lab/Alert';

interface AlertProps {
  open: boolean;
  message: string;
  severity: Color;
  onSnackbarClose: (e: React.SyntheticEvent<any, Event>, r: SnackbarCloseReason) => any;
  onAlertClose: () => any;
}

const Alert = (props: AlertProps) => {
  return (
    <Snackbar open={props.open} autoHideDuration={5000} onClose={props.onSnackbarClose}>
      <MuiAlert elevation={6} variant="filled" severity={props.severity} onClose={props.onAlertClose}>
        {props.message}
      </MuiAlert>
    </Snackbar>
  );
};

export default Alert;
