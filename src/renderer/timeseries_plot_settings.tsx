import * as React from "react";
import FormLabel from '@material-ui/core/FormLabel';
import FormControl from '@material-ui/core/FormControl';
import FormGroup from '@material-ui/core/FormGroup';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import FormHelperText from '@material-ui/core/FormHelperText';
import Switch from '@material-ui/core/Switch';

export default function SwitchesGroup() {

  const [state, setState] = React.useState({
    isBoatSpeed: false,                   // Boat Speed Plot selected
    isBoatDir: false,                   // Boat Direction Plot selected
    isHeading: false,                    // Heading Plot selected
    isPitch: false,                       // Pitch Plot selected
    isRoll: false,                       // Roll Plot selected
    isTemperature: false,                 // Temperature Plot selected
    isGnssQual: false,                   // GNSS Quality Indicator Plot selected
    isGnssHdop: false,                    // GNSS HDOP Plot selected
    isNumSat: false,                      // Number of GNSS satellites Plot selected
    isWaterSpeed: false,                  // Water Speed Plot selected
    isWaterDir: false,                   // Water Direction Plot selected
  });

  const handleChange = (name: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setState({ ...state, [name]: event.target.checked });
  };

  return (
    <FormControl component="fieldset">
      <FormLabel component="legend">Assign responsibility</FormLabel>
      <FormGroup>
        <FormControlLabel
          control={<Switch checked={state.isBoatSpeed} onChange={handleChange('isBoatSpeed')} value="isBoatSpeed" />}
          label="Boat Speed"
        />
        <FormControlLabel
          control={<Switch checked={state.isBoatDir} onChange={handleChange('isBoatDir')} value="isBoatDir" />}
          label="Boat Direction"
        />
        <FormControlLabel
          control={
            <Switch checked={state.isHeading} onChange={handleChange('isHeading')} value="isHeading" />
          }
          label="Heading"
        />
      </FormGroup>
      <FormHelperText>Be careful</FormHelperText>
    </FormControl>
  );
}

    /**
     * Set the Selected Plot type.

    const handleSelectedTypeChange = (event: React.ChangeEvent<{ value: unknown }>) => {
        setSelectedType(event.target.value as string);
      };

    return (
        <div>
            <FormControl variant="outlined" className={classes.formControl}>
                <InputLabel ref={inputLabel} id="demo-simple-select-outlined-label">
                Plot Type
                </InputLabel>
                <Select
                labelId="demo-simple-select-outlined-label"
                id="demo-simple-select-outlined"
                value={selectedType}
                onChange={handleSelectedTypeChange}
                labelWidth={labelWidth}
                >
                    <MenuItem value={1}>Boat Speed</MenuItem>
                    <MenuItem value={2}>Heading</MenuItem>
                    <MenuItem value={3}>Pitch</MenuItem>
                    <MenuItem value={4}>Roll</MenuItem>
                    <MenuItem value={5}>Temperature</MenuItem>
                    <MenuItem value={6}>GNSS Quality Indicator</MenuItem>
                    <MenuItem value={7}>GNSS HDOP</MenuItem>
                    <MenuItem value={8}>Number of GNSS Satellites</MenuItem>
                    <MenuItem value={9}>Water Speed</MenuItem>
                </Select>
            </FormControl>
        </div>
    );

};
*/