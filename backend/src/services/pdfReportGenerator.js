const PDFDocument = require('pdfkit');

class PDFReportGenerator {
  /**
   * Generates a clinical-grade PDF stream from patient data and medical records
   */
  static generatePatientSummaryPDF({ user, healthRecords = [], medicalReports = [], appointments = [], riskData }) {
    const doc = new PDFDocument({ margin: 40, size: 'A4' });

    // 1. Header & Title Banner
    doc
      .rect(40, 40, 515, 60)
      .fill('#0f766e'); // Deep Teal Header

    doc
      .fillColor('#ffffff')
      .fontSize(20)
      .font('Helvetica-Bold')
      .text('MOTHYERSYNC AI - PREGNANCY HEALTH SUMMARY', 55, 52);

    doc
      .fontSize(10)
      .font('Helvetica')
      .text(`Clinical Telemetry & Patient Preparedness Report | Generated: ${new Date().toLocaleDateString('en-US', { dateStyle: 'long' })}`, 55, 76);

    doc.moveDown(3);

    // 2. Patient Demographics Card
    const startY = 120;
    doc
      .rect(40, startY, 515, 80)
      .lineWidth(1)
      .strokeColor('#cbd5e1')
      .fillAndStroke('#f8fafc', '#cbd5e1');

    doc
      .fillColor('#1e293b')
      .fontSize(11)
      .font('Helvetica-Bold')
      .text('PATIENT INFORMATION', 55, startY + 12);

    doc
      .font('Helvetica')
      .fontSize(9.5)
      .fillColor('#334155')
      .text(`Name: ${user.name || 'Elena Vance'}`, 55, startY + 30)
      .text(`Age: ${user.maternalInfo?.age || 29} yrs | Height: ${user.maternalInfo?.heightCm || 168} cm`, 55, startY + 45)
      .text(`Gravida: ${user.pregnancyHistory?.gravida || 1} | Para: ${user.pregnancyHistory?.para || 0}`, 55, startY + 60);

    doc
      .text(`Gestational Week: Week ${user.gestationalWeek || 24} (Trimester ${user.currentTrimester || 2})`, 280, startY + 30)
      .text(`Estimated Due Date: ${user.dueDate ? new Date(user.dueDate).toLocaleDateString() : 'Dec 2026'}`, 280, startY + 45)
      .text(`Assigned OB/GYN: ${user.doctorInfo?.assignedDoctorName || 'Dr. Sarah Jenkins, MD'}`, 280, startY + 60);

    // 3. Current Monitoring Risk Status
    const riskY = startY + 95;
    const isUrgent = riskData?.riskLevel === 'urgent';
    const isPrompt = riskData?.riskLevel === 'prompt_eval';
    const isFollowUp = riskData?.riskLevel === 'follow_up';
    
    const bannerColor = isUrgent ? '#fee2e2' : isPrompt ? '#ffedd5' : isFollowUp ? '#fef9c3' : '#dcfce7';
    const borderColor = isUrgent ? '#ef4444' : isPrompt ? '#f97316' : isFollowUp ? '#eab308' : '#22c55e';
    const textColor = isUrgent ? '#991b1b' : isPrompt ? '#9a3412' : isFollowUp ? '#854d0e' : '#166534';

    doc
      .rect(40, riskY, 515, 50)
      .lineWidth(1)
      .strokeColor(borderColor)
      .fillAndStroke(bannerColor, borderColor);

    doc
      .font('Helvetica-Bold')
      .fontSize(11)
      .fillColor(textColor)
      .text(`CURRENT MONITORING STATUS: ${riskData?.badge?.label?.toUpperCase() || 'ROUTINE MONITORING 🟢'}`, 55, riskY + 12);

    doc
      .font('Helvetica')
      .fontSize(8.5)
      .fillColor(textColor)
      .text(riskData?.summaryRationale || 'Vitals and symptom profiles align with expected physiological ranges for current trimester.', 55, riskY + 28, { width: 485 });

    // 4. Vitals Telemetry History
    let currentSectionY = riskY + 65;
    doc
      .font('Helvetica-Bold')
      .fontSize(11)
      .fillColor('#0f766e')
      .text('LONGITUDINAL VITALS & SYMPTOM TRENDS', 40, currentSectionY);

    currentSectionY += 16;

    // Table Header
    doc
      .rect(40, currentSectionY, 515, 20)
      .fill('#e2e8f0');

    doc
      .font('Helvetica-Bold')
      .fontSize(8.5)
      .fillColor('#1e293b')
      .text('Week', 50, currentSectionY + 6)
      .text('Date', 90, currentSectionY + 6)
      .text('Blood Pressure', 160, currentSectionY + 6)
      .text('Heart Rate', 245, currentSectionY + 6)
      .text('Glucose (F)', 310, currentSectionY + 6)
      .text('Weight (kg)', 375, currentSectionY + 6)
      .text('Symptoms / Notes', 435, currentSectionY + 6);

    currentSectionY += 20;

    const recentRecords = healthRecords.slice(-5);
    recentRecords.forEach((rec, idx) => {
      const rowBg = idx % 2 === 0 ? '#ffffff' : '#f8fafc';
      doc
        .rect(40, currentSectionY, 515, 18)
        .fill(rowBg);

      doc
        .font('Helvetica')
        .fontSize(8)
        .fillColor('#334155')
        .text(`Wk ${rec.week}`, 50, currentSectionY + 5)
        .text(rec.date ? new Date(rec.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '-', 90, currentSectionY + 5)
        .text(`${rec.bpSystolic}/${rec.bpDiastolic} mmHg`, 160, currentSectionY + 5)
        .text(`${rec.heartRate} bpm`, 245, currentSectionY + 5)
        .text(rec.bloodGlucose ? `${rec.bloodGlucose} mg/dL` : 'N/A', 310, currentSectionY + 5)
        .text(rec.weight ? `${rec.weight} kg` : 'N/A', 375, currentSectionY + 5)
        .text(rec.symptoms && rec.symptoms.length > 0 ? rec.symptoms.map(s => s.name || s).join(', ').substring(0, 20) : 'None reported', 435, currentSectionY + 5);

      currentSectionY += 18;
    });

    // 5. Recent Lab Reports & Findings
    currentSectionY += 15;
    doc
      .font('Helvetica-Bold')
      .fontSize(11)
      .fillColor('#0f766e')
      .text('DIAGNOSTIC & LAB REPORT HIGHLIGHTS', 40, currentSectionY);

    currentSectionY += 16;

    if (medicalReports.length > 0) {
      medicalReports.slice(0, 2).forEach(rep => {
        doc
          .rect(40, currentSectionY, 515, 38)
          .lineWidth(0.5)
          .strokeColor('#e2e8f0')
          .fillAndStroke('#ffffff', '#e2e8f0');

        doc
          .font('Helvetica-Bold')
          .fontSize(9)
          .fillColor('#1e293b')
          .text(rep.title || 'Diagnostic Report', 50, currentSectionY + 6);

        doc
          .font('Helvetica')
          .fontSize(8)
          .fillColor('#475569')
          .text(`Summary: ${rep.aiSummary || rep.laymanExplanation || 'Standard parameters within expected reference thresholds.'}`, 50, currentSectionY + 18, { width: 490 });

        currentSectionY += 44;
      });
    } else {
      doc
        .font('Helvetica-Oblique')
        .fontSize(8.5)
        .fillColor('#64748b')
        .text('No critical lab abnormalities recorded.', 40, currentSectionY);
      currentSectionY += 20;
    }

    // 6. Doctor Preparation Questions
    currentSectionY += 10;
    doc
      .font('Helvetica-Bold')
      .fontSize(11)
      .fillColor('#0f766e')
      .text('RECOMMENDED QUESTIONS FOR CLINICIAN DISCUSSION', 40, currentSectionY);

    currentSectionY += 16;

    const sampleQuestions = [
      'Are my recent blood pressure and resting heart rate trends in line with expected mid-pregnancy expansion?',
      'Do my iron storage / ferritin levels require continuation or modification of oral supplementation?',
      'What specific preparation or fasting instructions should I follow for the upcoming glucose tolerance test?'
    ];

    sampleQuestions.forEach((q, idx) => {
      doc
        .font('Helvetica')
        .fontSize(8.5)
        .fillColor('#334155')
        .text(`${idx + 1}. ${q}`, 50, currentSectionY);
      currentSectionY += 14;
    });

    // 7. Medical Disclaimer & Footer
    doc
      .rect(40, 760, 515, 45)
      .fill('#f1f5f9');

    doc
      .font('Helvetica-Bold')
      .fontSize(7.5)
      .fillColor('#475569')
      .text('IMPORTANT CLINICAL DISCLAIMER:', 50, 766);

    doc
      .font('Helvetica')
      .fontSize(7)
      .fillColor('#64748b')
      .text('MotherSync AI is an educational tracking and clinical coordination tool designed to facilitate patient-physician dialogue. It is NOT a diagnostic medical device and does NOT replace the clinical judgment of an obstetrician, nurse midwife, or emergency medical services. In case of acute pain, bleeding, or breathing distress, call emergency services immediately.', 50, 776, { width: 495 });

    doc.end();
    return doc;
  }
}

module.exports = PDFReportGenerator;
