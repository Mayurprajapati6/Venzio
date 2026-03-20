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
import paymentRouter from '../../modules/payment/payment.routes';
import disputeRouter from '../../modules/dispute/dispute.routes';
import escrowRouter from '../../modules/escrow/escrow.routes';
import reviewRouter from '../../modules/review/review.routes';
import userDashboardRouter from '../../modules/userDashboard/userDashboard.routes';
import ownerDashboardRouter from '../../modules/ownerDashboard/ownerDashboard.routes';
import adminDashboardRouter from '../../modules/adminDashboard/adminDashboard.routes';
import attendanceAnalyticsRouter from '../../modules/attendanceAnalytics/attendanceAnalytics.routes';

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

// payment
v1Router.use('/payments', paymentRouter);

// dispute
v1Router.use('/disputes', disputeRouter);

// escrow
v1Router.use('/escrow', escrowRouter);

// review
v1Router.use('/reviews', reviewRouter);

// user dashboard
v1Router.use('/user/dashboard', userDashboardRouter);

// owner dashboard
v1Router.use('/owner/dashboard', ownerDashboardRouter);

// admin dashboard
v1Router.use('/admin', adminDashboardRouter);

// user attendance analytics
v1Router.use('/user/attendance', attendanceAnalyticsRouter);

export default v1Router;

