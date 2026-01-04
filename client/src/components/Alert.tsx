/**
 * @component used as a popup alert system to notify users of some info
 */

import React from 'react';
import { Snackbar, SnackbarCloseReason, Alert as MuiAlert, AlertColor } from '@mui/material';

interface AlertProps {
  open: boolean;
  message: string;
  severity: AlertColor;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onSnackbarClose: (event: Event | React.SyntheticEvent<any, Event>, reason: SnackbarCloseReason) => void;
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
