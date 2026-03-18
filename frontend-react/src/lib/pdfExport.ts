import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Employee {
  empId: string;
  firstName: string;
  lastName: string;
  departmentName: string;
  salary: number;
}

interface ExportStats {
  totalEmployees: number;
  averageSalary: number;
  averageAge: number;
  departmentCount: number;
}

export const exportEmployeesToPDF = (
  employees: Employee[],
  stats: ExportStats,
  title: string = 'Employee Management System Report'
) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const timestamp = new Date().toLocaleString();

  // Branding & Header
  doc.setFontSize(22);
  doc.setTextColor(99, 102, 241); // Indigo-500
  doc.text('EMS.', 14, 22);
  doc.setFontSize(10);
  doc.setTextColor(148, 163, 184); // Slate-400
  doc.text('Employee Management System', 14, 28);
  doc.text(`Generated: ${timestamp}`, pageWidth - 14, 28, { align: 'right' });

  // Main Title
  doc.setFontSize(18);
  doc.setTextColor(30, 41, 59); // Slate-800
  doc.text(title, 14, 45);

  // Summary Metrics Section
  doc.setDrawColor(241, 245, 249); // Slate-100
  doc.setFillColor(248, 250, 252); // Slate-50
  doc.roundedRect(14, 52, pageWidth - 28, 30, 3, 3, 'FD');

  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139); // Slate-500
  doc.text('TOTAL EMPLOYEES', 20, 60);
  doc.text('AVG SALARY', 65, 60);
  doc.text('AVG AGE', 110, 60);
  doc.text('DEPARTMENTS', 155, 60);

  doc.setFontSize(14);
  doc.setTextColor(30, 41, 59); // Slate-800
  doc.text(stats.totalEmployees.toString(), 20, 72);
  doc.text(`$${Math.round(stats.averageSalary).toLocaleString()}`, 65, 72);
  doc.text(`${Math.round(stats.averageAge)} yrs`, 110, 72);
  doc.text(stats.departmentCount.toString(), 155, 72);

  // Employee Table
  const tableData = employees.map(emp => [
    emp.empId,
    `${emp.firstName} ${emp.lastName}`,
    emp.departmentName,
    `$${emp.salary.toLocaleString()}`
  ]);

  autoTable(doc, {
    startY: 95,
    head: [['ID', 'Name', 'Department', 'Salary']],
    body: tableData,
    theme: 'striped',
    headStyles: {
      fillColor: [99, 102, 241],
      textColor: 255,
      fontSize: 10,
      fontStyle: 'bold',
      halign: 'left'
    },
    bodyStyles: {
      fontSize: 9,
      textColor: [51, 65, 85]
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    },
    margin: { top: 95 },
    didDrawPage: () => {
      // Footer
      const str = 'Page ' + doc.getNumberOfPages();
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(str, pageWidth - 20, doc.internal.pageSize.height - 10);
    }
  });

  doc.save(`ems_report_${new Date().toISOString().split('T')[0]}.pdf`);
};
