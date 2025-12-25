import express from 'express';
import pingRouter from './ping.router';
import authRouter from '../../modules/auth/auth.router';
import subscriptionRouter from '../../modules/subscription/subscription.router'
import facilityRouter from '../../modules/facility/facility.router';
import categoryRouter from '../../modules/category/category.router'
import slotRouter from '../../modules/slot/slot.router';
import holidayRouter from '../../modules/holiday/holiday.router';
import FacilitySerach from '../../modules/facility-public/publicFacility.router';
import bookingRouter from '../../modules/booking/booking.router';
import attendanceRouter from '../../modules/attendance/attendance.router';

const v1Router = express.Router();



v1Router.use('/ping',  pingRouter);

// auth
v1Router.use('/auth', authRouter);

// subscription
v1Router.use('/subscription',subscriptionRouter);

// facility
v1Router.use('/facilities', facilityRouter);

// category
v1Router.use('/categories', categoryRouter);

// slot
v1Router.use('/slots', slotRouter);

// holiday
v1Router.use('/holidays', holidayRouter);

// facilitySearch
v1Router.use('/public/facilities', FacilitySerach);

// booking
v1Router.use('/bookings', bookingRouter);

// attendance
v1Router.use('/attendance', attendanceRouter);

export default v1Router;

