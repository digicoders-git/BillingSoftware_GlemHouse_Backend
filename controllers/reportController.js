const Dispatch = require('../models/Dispatch');
const moment = require('moment');

// @desc    Get daily report
// @route   GET /api/reports/daily
// @access  Private
const getDailyReport = async (req, res) => {
  try {
    const today = moment().startOf('day');
    const tomorrow = moment(today).add(1, 'days');

    const dispatches = await Dispatch.find({
      date: { $gte: today.toDate(), $lt: tomorrow.toDate() }
    }).populate('branch', 'name');

    const totalRevenue = dispatches.reduce((sum, d) => sum + d.totalValue, 0);
    const totalItems = dispatches.reduce((sum, d) => sum + d.totalItems, 0);
    const pending = dispatches.filter(d => d.status === 'Dispatched').length;
    const received = dispatches.filter(d => d.status === 'Received').length;

    res.json({
      stats: {
        todayDispatches: dispatches.length,
        todayRevenue: totalRevenue,
        pendingDeliveries: pending,
        receivedToday: received
      },
      log: dispatches.map(d => ({
        time: moment(d.date).format('hh:mm A'),
        branch: d.branch?.name || 'N/A',
        products: d.items.map(i => `${i.name} x ${i.qty}`).join(', '),
        qty: d.totalItems,
        status: d.status
      }))
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get monthly report
// @route   GET /api/reports/monthly
// @access  Private
const getMonthlyReport = async (req, res) => {
  try {
    const startOfMonth = moment().startOf('month');
    const endOfMonth = moment().endOf('month');

    const dispatches = await Dispatch.find({
      date: { $gte: startOfMonth.toDate(), $lte: endOfMonth.toDate() }
    });

    const totalRevenue = dispatches.reduce((sum, d) => sum + d.totalValue, 0);
    const avgPerDay = (dispatches.length / moment().date()).toFixed(1);

    // Weekly breakdown for chart
    const weeklyData = [
      { week: 'Week 1', dispatches: 0 },
      { week: 'Week 2', dispatches: 0 },
      { week: 'Week 3', dispatches: 0 },
      { week: 'Week 4', dispatches: 0 },
    ];

    dispatches.forEach(d => {
      const day = moment(d.date).date();
      if (day <= 7) weeklyData[0].dispatches += d.totalItems;
      else if (day <= 14) weeklyData[1].dispatches += d.totalItems;
      else if (day <= 21) weeklyData[2].dispatches += d.totalItems;
      else weeklyData[3].dispatches += d.totalItems;
    });

    res.json({
      stats: {
        monthlyDispatches: dispatches.length,
        monthlyRevenue: totalRevenue,
        avgPerDay: avgPerDay,
        fulfillmentRate: '98%' // Dummy
      },
      chartData: weeklyData,
      monthName: moment().format('MMMM YYYY')
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get yearly report
// @route   GET /api/reports/yearly
// @access  Private
const getYearlyReport = async (req, res) => {
  try {
    const startOfYear = moment().startOf('year');
    const endOfYear = moment().endOf('year');

    const dispatches = await Dispatch.find({
      date: { $gte: startOfYear.toDate(), $lte: endOfYear.toDate() }
    });

    const totalRevenue = dispatches.reduce((sum, d) => sum + d.totalValue, 0);

    // Monthly breakdown for chart
    const monthlyData = moment.monthsShort().map(month => ({
      name: month,
      value: 0
    }));

    dispatches.forEach(d => {
      const monthIdx = moment(d.date).month();
      monthlyData[monthIdx].value += d.totalValue;
    });

    res.json({
      stats: {
        yearlyDispatches: dispatches.length,
        yearlyRevenue: totalRevenue,
        growthRate: '+15%',
        topCategory: 'Electronics'
      },
      chartData: monthlyData,
      year: moment().format('YYYY')
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getDailyReport,
  getMonthlyReport,
  getYearlyReport
};
