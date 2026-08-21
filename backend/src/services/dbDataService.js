const User = require('../models/User');
const PregnancyProfile = require('../models/PregnancyProfile');
const HealthRecord = require('../models/HealthRecord');
const HealthMeasurement = require('../models/HealthMeasurement');
const Symptom = require('../models/Symptom');
const Alert = require('../models/Alert');
const MedicalReport = require('../models/MedicalReport');
const Appointment = require('../models/Appointment');
const Medication = require('../models/Medication');
const Reminder = require('../models/Reminder');
const TimelineEvent = require('../models/TimelineEvent');
const AgentEvent = require('../models/AgentEvent');
const { isMockMode } = require('../config/db');
const mockStore = require('../models/mockStore');

class DBDataService {
  /**
   * Retrieves pregnancy profile for an authorized user.
   */
  static async getPregnancyProfile(userId) {
    if (!userId) return null;
    if (isMockMode()) {
      return mockStore.getPregnancyProfile(userId);
    }
    let profile = await PregnancyProfile.findOne({ userId });
    if (!profile) {
      const user = await User.findById(userId);
      if (user) {
        profile = {
          userId: user._id,
          gestationalWeek: user.gestationalWeek || 24,
          trimester: user.currentTrimester || 2,
          estimatedDueDate: user.dueDate,
          allergies: user.maternalInfo?.allergies || [],
          currentMedications: user.maternalInfo?.currentMedications || []
        };
      }
    }
    return profile;
  }

  /**
   * Retrieves historical health measurements with optional type and timeRange filter (7, 30, 90, all).
   */
  static async getHealthMeasurements(userId, type = null, timeRangeDays = null) {
    if (!userId) return [];
    if (isMockMode()) {
      let records = mockStore.getHealthRecords(userId);
      if (timeRangeDays && timeRangeDays !== 'all') {
        const cutoff = new Date(Date.now() - Number(timeRangeDays) * 24 * 60 * 60 * 1000);
        records = records.filter(r => new Date(r.date || r.recordedAt) >= cutoff);
      }
      return records;
    }

    let query = { userId };
    if (timeRangeDays && timeRangeDays !== 'all') {
      const cutoff = new Date(Date.now() - Number(timeRangeDays) * 24 * 60 * 60 * 1000);
      query.date = { $gte: cutoff };
    }

    const records = await HealthRecord.find(query).sort({ date: 1 });
    return records;
  }

  /**
   * Retrieves reported symptoms for authorized user.
   */
  static async getSymptoms(userId, limit = 20) {
    if (!userId) return [];
    if (isMockMode()) {
      return mockStore.getSymptoms(userId).slice(0, limit);
    }
    return await Symptom.find({ userId }).sort({ recordedAt: -1 }).limit(limit);
  }

  /**
   * Retrieves recent clinical alerts for authorized user.
   */
  static async getRecentAlerts(userId, limit = 10) {
    if (!userId) return [];
    if (isMockMode()) {
      return mockStore.getAlerts(userId).slice(0, limit);
    }
    return await Alert.find({ userId }).sort({ createdAt: -1 }).limit(limit);
  }

  /**
   * Retrieves diagnostic lab and ultrasound reports.
   */
  static async getMedicalReports(userId, limit = 20) {
    if (!userId) return [];
    if (isMockMode()) {
      return mockStore.getMedicalReports(userId).slice(0, limit);
    }
    return await MedicalReport.find({ userId }).sort({ dateUploaded: -1 }).limit(limit);
  }

  /**
   * Retrieves scheduled appointments.
   */
  static async getAppointments(userId) {
    if (!userId) return [];
    if (isMockMode()) {
      return mockStore.getAppointments(userId);
    }
    return await Appointment.find({ userId }).sort({ date: 1 });
  }

  /**
   * Retrieves active medications.
   */
  static async getMedications(userId) {
    if (!userId) return [];
    if (isMockMode()) {
      return [
        { medicationName: 'Prenatal Multivitamin with DHA', dosage: '1 tablet daily', schedule: 'Morning with food' },
        { medicationName: 'Oral Iron (Ferrous Sulfate)', dosage: '65mg elemental iron', schedule: 'Evening with citrus' }
      ];
    }
    return await Medication.find({ userId }).sort({ createdAt: -1 });
  }

  /**
   * Retrieves reminders.
   */
  static async getReminders(userId) {
    if (!userId) return [];
    if (isMockMode()) {
      return [
        { type: 'vitals', title: 'Daily Blood Pressure Check', scheduledTime: new Date(), completed: false },
        { type: 'hydration', title: 'Hydration Goal (80 oz)', scheduledTime: new Date(), completed: true }
      ];
    }
    return await Reminder.find({ userId }).sort({ scheduledTime: 1 });
  }

  /**
   * Retrieves chronological health timeline events.
   */
  static async getHealthTimeline(userId, limit = 50) {
    if (!userId) return [];
    if (isMockMode()) {
      return mockStore.getTimeline(userId).slice(0, limit);
    }
    return await TimelineEvent.find({ userId }).sort({ date: -1 }).limit(limit);
  }

  /**
   * Controlled creation of a health measurement.
   */
  static async createHealthMeasurement(data) {
    if (!data.userId) throw new Error('userId is required');
    if (isMockMode()) {
      return mockStore.addHealthRecord(data.userId, data);
    }
    const record = await HealthRecord.create({
      userId: data.userId,
      week: data.week || 24,
      date: data.date || new Date(),
      bpSystolic: data.bpSystolic || data.systolicBP,
      bpDiastolic: data.bpDiastolic || data.diastolicBP,
      heartRate: data.heartRate,
      bloodGlucose: data.bloodGlucose,
      glucoseType: data.glucoseType || 'fasting',
      weight: data.weight,
      temperature: data.temperature || 36.8,
      oxygenSaturation: data.oxygenSaturation || 98,
      source: data.source || 'manual',
      fetalKicks: data.fetalKicks,
      symptoms: data.symptoms || [],
      riskLevel: data.riskLevel || 'routine',
      riskRationale: data.riskRationale || 'Routine vital reading'
    });
    return record;
  }

  /**
   * Controlled creation of a clinical alert.
   */
  static async createAlert(data) {
    if (!data.userId) throw new Error('userId is required');
    if (isMockMode()) {
      return mockStore.addAlert(data.userId, data);
    }
    return await Alert.create({
      userId: data.userId,
      severity: data.severity || 'routine',
      category: data.category || 'vital_check',
      message: data.message,
      recommendedAction: data.recommendedAction,
      status: 'active',
      source: data.source || 'safety_engine'
    });
  }

  /**
   * Logs an agent event for telemetry auditing (without private chain-of-thought).
   */
  static async logAgentEvent(data) {
    if (!data.userId || isMockMode()) return;
    try {
      await AgentEvent.create({
        userId: data.userId,
        requestType: data.requestType || 'chat_query',
        selectedAgent: data.selectedAgent || 'supervisor',
        riskLevel: data.riskLevel || 'routine',
        action: data.action || 'answered'
      });
    } catch (e) {
      console.warn('AgentEvent log error:', e.message);
    }
  }
}

module.exports = DBDataService;
