import * as React from "react";
import { createStyles, makeStyles, Theme } from '@material-ui/core/styles';
import TextField from '@material-ui/core/TextField';
import FormControl from '@material-ui/core/FormControl';
import InputLabel from '@material-ui/core/InputLabel';
import OutlinedInput from '@material-ui/core/OutlinedInput';
import Input from '@material-ui/core/Input';
import Grid from '@material-ui/core/Grid';
import DateFnsUtils from '@date-io/date-fns';
import * as startOfDay from '@date-io/date-fns';
import {
  MuiPickersUtilsProvider,
  KeyboardTimePicker,
  KeyboardDatePicker,
} from '@material-ui/pickers';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      display: 'flex',
      flexWrap: 'wrap',
    },
    margin: {
      margin: theme.spacing(1),
    },
    withoutLabel: {
      marginTop: theme.spacing(3),
    },
    textField: {
      width: 200,
    },
  }),
);

interface State {
  amount: string;
  password: string;
  weight: string;
  weightRange: string;
  showPassword: boolean;
}

export default function SiteInformation() {
  const classes = useStyles();

  // State data
  const [selectedDate, setSelectedDate] = React.useState<Date | null>(new Date(),);
  const [values, setValues] = React.useState<State>({
    amount: '',
    password: '',
    weight: '',
    weightRange: '',
    showPassword: false,
  });

  // Handle date change
  const handleDateChange = (date: Date | null) => {
    setSelectedDate(date);
  };

  const handleChange = (prop: keyof State) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setValues({ ...values, [prop]: event.target.value });
  };

  return (
    <div className={classes.root}>
      <div>
      <FormControl fullWidth className={classes.margin}>
          <InputLabel htmlFor="outlined-adornment-amount">Station Name</InputLabel>
          <Input
            id="outlined-adornment-amount"
            value={values.amount}
            onChange={handleChange('amount')}
          />
        </FormControl>
        <FormControl fullWidth className={classes.margin}>
          <InputLabel htmlFor="outlined-adornment-amount">Station Number</InputLabel>
          <Input
            id="outlined-adornment-amount"
            value={values.amount}
            onChange={handleChange('amount')}
          />
        </FormControl>
        <FormControl fullWidth className={classes.margin} >
          <InputLabel htmlFor="outlined-adornment-amount">River Name</InputLabel>
          <Input
            id="outlined-adornment-amount"
            value={values.amount}
            onChange={handleChange('amount')}
            
          />
        </FormControl>
        <FormControl fullWidth className={classes.margin}>
        <MuiPickersUtilsProvider utils={DateFnsUtils}>
            <KeyboardDatePicker
              disableToolbar
              variant="inline"
              format="MM/dd/yyyy"
              margin="normal"
              id="date-picker-inline"
              label="Date of Measurement"
              value={selectedDate}
              onChange={handleDateChange}
              KeyboardButtonProps={{
                'aria-label': 'change date',
              }}
            />
          </MuiPickersUtilsProvider>
        </FormControl>
        <FormControl fullWidth className={classes.margin}>
          <InputLabel htmlFor="outlined-adornment-amount">Measurement Number</InputLabel>
          <Input
            id="outlined-adornment-amount"
            value={values.amount}
            onChange={handleChange('amount')}
          />
        </FormControl>
      </div>
      <div>
        <Grid container spacing={3}>
          <Grid xs={6}>
            <div>
              <FormControl fullWidth className={classes.margin}>
                <InputLabel htmlFor="outlined-adornment-amount">Agency</InputLabel>
                <Input
                  id="outlined-adornment-amount"
                  value={values.amount}
                  onChange={handleChange('amount')}
                />
              </FormControl>
            </div>
          </Grid>
          <Grid xs={6}>
            <div>
              <FormControl fullWidth className={classes.margin}>
                  <InputLabel htmlFor="outlined-adornment-amount">Field Party</InputLabel>
                  <Input
                    id="outlined-adornment-amount"
                    value={values.amount}
                    onChange={handleChange('amount')}
                  />
                </FormControl>
              </div>
          </Grid>
        </Grid>
      </div>


    </div>
  );
}