import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Modal, Box, Tab, Tabs, Paper } from '@mui/material';
import SignInPage from '../../SignInPage';
import RegisterPage from '../../RegisterPage';
import { closeAuthModal } from '../../store/authSlice';
import PropTypes from 'prop-types';

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 400,
  bgcolor: 'background.paper',
  boxShadow: 24,
  p: 0,
  borderRadius: 1,
  overflow: 'hidden',
};

function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`auth-tabpanel-${index}`}
      aria-labelledby={`auth-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

export default function AuthModal() {
  const dispatch = useDispatch();
  const { isAuthModalOpen } = useSelector((state) => state.auth);
  const [tabValue, setTabValue] = useState(0);
  const [getDemoToken] = useGetDemoTokenMutation();

  const handleClose = () => {
    dispatch(closeAuthModal());
  };

  const handleChange = (event, newValue) => {
    setTabValue(newValue);
  };

  return (
    <Modal
      open={isAuthModalOpen}
      onClose={handleClose}
      aria-labelledby="auth-modal-title"
      aria-describedby="auth-modal-description"
    >
      <Box sx={style}>
        <Paper square>
          <Tabs
            value={tabValue}
            onChange={handleChange}
            aria-label="auth tabs"
            variant="fullWidth"
            indicatorColor="primary"
            textColor="primary"
          >
            <Tab label="Sign In" id="auth-tab-0" aria-controls="auth-tabpanel-0" />
            <Tab label="Register" id="auth-tab-1" aria-controls="auth-tabpanel-1" />
          </Tabs>
        </Paper>
        <TabPanel value={tabValue} index={0}>
          <SignInPage isModal={true} onAuthSuccess={handleClose} />
        </TabPanel>
        <TabPanel value={tabValue} index={1}>
          <RegisterPage isModal={true} onAuthSuccess={handleClose} />
        </TabPanel>
      </Box>
    </Modal>
  );
              Попробовать демо-режим
            </Button>
          </Box>
        </TabPanel>
        <TabPanel value={tabValue} index={1}>
          <RegisterPage isModal={true} onAuthSuccess={handleClose} />
        </TabPanel>
      </Box>
    </Modal>
  );
}

TabPanel.propTypes = {
  children: PropTypes.node,
  index: PropTypes.number.isRequired,
  value: PropTypes.number.isRequired,
};