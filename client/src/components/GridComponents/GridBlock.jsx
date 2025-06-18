// GridBlock.js
import React from "react";
import PropTypes from "prop-types";
import Box from "@mui/material/Box";


class GridBlock extends React.Component {
  render() {
    const { text } = this.props;
    return (
        <Box
            display="flex"
            alignItems="center"
            sx={{ border: '2px solid grey' }}
            height="100%"
        >
            This Box
        </Box>
    );
  }
}

GridBlock.propTypes = {
    text: PropTypes.string.isRequired,
  };

export default GridBlock;
