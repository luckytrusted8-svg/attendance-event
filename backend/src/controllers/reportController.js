const prisma = require('../config/db');
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');

async function getReports(req, res) {
  try {
    const events = await prisma.event.findMany({
      include: {
        _count: { select: { registrations: true } },
      },
      orderBy: { eventDate: 'desc' },
    });
    

    const perEvent = await Promise.all(
      events.map(async (e) => {
        const totalAttended = await prisma.attendance.count({
          where: { registration: { eventId: e.id }, attendanceStatus: 'hadir' },
        });
        const totalRegistrations = e._count.registrations;
        const attendanceRate = totalRegistrations > 0 ? Math.round((totalAttended / totalRegistrations) * 100) : 0;
        return {
          eventId: e.id,
          title: e.title,
          eventDate: e.eventDate,
          status: e.status,
          totalRegistrations,
          totalAttended,
          attendanceRate,
        };
      })
    );

    const totalEvents = events.length;
    const totalRegistrationsAll = perEvent.reduce((sum, e) => sum + e.totalRegistrations, 0);
    const totalAttendedAll = perEvent.reduce((sum, e) => sum + e.totalAttended, 0);
    const overallAttendanceRate =
      totalRegistrationsAll > 0 ? Math.round((totalAttendedAll / totalRegistrationsAll) * 100) : 0;

    return res.json({
      success: true,
      data: {
        summary: {
          totalEvents,
          totalRegistrations: totalRegistrationsAll,
          totalAttended: totalAttendedAll,
          overallAttendanceRate,
        },
        perEvent,
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server.', error: err.message });
  }
}

async function exportPdf(req, res) {
  try {
    const events = await prisma.event.findMany({
      include: {
        _count: {
          select: {
            registrations: true,
          },
        },
      },
      orderBy: {
        eventDate: 'desc',
      },
    });

    const perEvent = await Promise.all(
      events.map(async (e) => {
        const totalAttended = await prisma.attendance.count({
          where: {
            registration: {
              eventId: e.id,
            },
            attendanceStatus: 'hadir',
          },
        });

        const totalRegistrations = e._count.registrations;

        return {
          title: e.title,
          eventDate: e.eventDate,
          status: e.status,
          totalRegistrations,
          totalAttended,
          attendanceRate:
            totalRegistrations > 0
              ? Math.round((totalAttended / totalRegistrations) * 100)
              : 0,
        };
      })
    );

    const totalEvents = perEvent.length;
    const totalRegistrations = perEvent.reduce(
      (a, b) => a + b.totalRegistrations,
      0
    );

    const totalAttended = perEvent.reduce(
      (a, b) => a + b.totalAttended,
      0
    );

    const attendanceRate =
      totalRegistrations > 0
        ? Math.round((totalAttended / totalRegistrations) * 100)
        : 0;

    const doc = new PDFDocument({
      margin: 40,
      size: 'A4',
    });

    res.setHeader('Content-Type', 'application/pdf');

    res.setHeader(
      'Content-Disposition',
      'attachment; filename=Laporan-Event.pdf'
    );

    doc.pipe(res);

    // ======================
    // HEADER
    // ======================

    doc
      .fontSize(22)
      .fillColor('#2563eb')
      .text('Attendance Event Report', {
        align: 'center',
      });

    doc.moveDown(0.3);

    doc
      .fontSize(11)
      .fillColor('black')
      .text(
        `Tanggal Export : ${new Date().toLocaleDateString('id-ID')}`,
        {
          align: 'center',
        }
      );

    doc.moveDown(2);

    // ======================
    // SUMMARY
    // ======================

    doc.fontSize(16).text('Ringkasan');

    doc.moveDown();

    doc.fontSize(12);

    doc.text(`Total Event             : ${totalEvents}`);

    doc.text(`Total Pendaftar         : ${totalRegistrations}`);

    doc.text(`Total Hadir             : ${totalAttended}`);

    doc.text(`Attendance Rate         : ${attendanceRate}%`);

    doc.moveDown(2);

    // ======================
    // TABLE HEADER
    // ======================

    doc.fontSize(15).text('Laporan Per Event');

    doc.moveDown();

    doc.fontSize(11);

    doc.text(
      '--------------------------------------------------------------------------------------------'
    );

    doc.text(
      'Event                  Tanggal        Status      Daftar     Hadir     Rate'
    );

    doc.text(
      '--------------------------------------------------------------------------------------------'
    );

    perEvent.forEach((item) => {
      const tanggal = new Date(item.eventDate).toLocaleDateString('id-ID');

      doc.text(
        `${item.title.substring(0,20).padEnd(22)}
${tanggal.padEnd(14)}
${item.status.padEnd(10)}
${String(item.totalRegistrations).padEnd(10)}
${String(item.totalAttended).padEnd(10)}
${item.attendanceRate}%`
      );
    });

    doc.moveDown();

    doc.text(
      '--------------------------------------------------------------------------------------------'
    );

    doc.moveDown(2);

    // ======================
    // FOOTER
    // ======================

    doc
      .fontSize(10)
      .fillColor('gray')
      .text(
        'Generated by Attendance Event Management System',
        {
          align: 'center',
        }
      );

    doc.end();
  } catch (err) {
    console.log(err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
}
async function exportExcel(req, res) {
  try {
    const events = await prisma.event.findMany({
      include: {
        _count: {
          select: {
            registrations: true,
          },
        },
      },
      orderBy: {
        eventDate: 'desc',
      },
    });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Laporan Event');

    worksheet.columns = [
      { header: 'No', key: 'no', width: 8 },
      { header: 'Nama Event', key: 'title', width: 35 },
      { header: 'Tanggal Event', key: 'date', width: 18 },
      { header: 'Status', key: 'status', width: 18 },
      { header: 'Total Pendaftar', key: 'registrations', width: 18 },
      { header: 'Total Hadir', key: 'attended', width: 18 },
      { header: 'Attendance Rate', key: 'rate', width: 18 },
    ];

    worksheet.getRow(1).font = {
      bold: true,
      color: { argb: 'FFFFFFFF' },
    };

    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '2563EB' },
    };

    worksheet.getRow(1).alignment = {
      vertical: 'middle',
      horizontal: 'center',
    };

    let no = 1;

    for (const event of events) {
      const totalAttended = await prisma.attendance.count({
        where: {
          registration: {
            eventId: event.id,
          },
          attendanceStatus: 'hadir',
        },
      });

      const totalRegistrations = event._count.registrations;

      const attendanceRate =
        totalRegistrations > 0
          ? Math.round((totalAttended / totalRegistrations) * 100)
          : 0;

      worksheet.addRow({
        no: no++,
        title: event.title,
        date: new Date(event.eventDate).toLocaleDateString('id-ID'),
        status: event.status,
        registrations: totalRegistrations,
        attended: totalAttended,
        rate: attendanceRate + '%',
      });
    }

    worksheet.eachRow((row) => {
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          bottom: { style: 'thin' },
          left: { style: 'thin' },
          right: { style: 'thin' },
        };
      });
    });

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );

    res.setHeader(
      'Content-Disposition',
      'attachment; filename=Laporan-Event.xlsx'
    );

    await workbook.xlsx.write(res);

    res.end();
  } catch (err) {
    console.log(err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
}

module.exports = {
  getReports,
  exportPdf,
  exportExcel,
};