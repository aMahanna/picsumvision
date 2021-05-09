/**
 * @component used as a popup alert system to notify users of some info
 */

import React from 'react';
import { Snackbar, SnackbarCloseReason } from '@material-ui/core';
import MuiAlert, { Color } from '@material-ui/lab/Alert';

interface AlertProps {
  open: boolean;
  message: string;
  severity: Color;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onSnackbarClose: (e: React.SyntheticEvent<any, Event>, r: SnackbarCloseReason) => void;
  onAlertClose: () => void;
}

const Alert = (props: AlertProps) => {
  return (
    <Snackbar open={props.open} autoHideDuration={5000} onClose={props.onSnackbarClose}>
      <MuiAlert elevation={6} severity={props.severity} onClose={props.onAlertClose}>
        {props.message}
      </MuiAlert>
    </Snackbar>
  );
};

export default Alert;
