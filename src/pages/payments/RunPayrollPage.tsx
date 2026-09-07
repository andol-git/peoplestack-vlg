import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Alert, Button, Card, Col, DatePicker, Popconfirm, Row, Select, Statistic, Table, Tag, message } from 'antd';
import { DownloadOutlined, PlayCircleOutlined, SearchOutlined } from '@ant-design/icons';
import dayjs, { type Dayjs } from 'dayjs';
import { useCustomersQuery } from '../../hooks/useCustomers';
import { useFetchPayrollRun, usePayrollPreviewQuery, usePayrollRunsQuery, useRunPayroll } from '../../hooks/usePayroll';
import type { PayrollLine, PayrollRunDetail, PayrollRunSummary } from '../../types/models';

function formatCurrency(value: number): string {
  return `₹${value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function slugify(name: string): string {
  return name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function csvCell(value: unknown): string {
  return `"${String(value ?? '').replace(/"/g, '""')}"`;
}

function triggerCsvDownload(csv: string, filename: string) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function downloadPayrollRunsCsv(runs: PayrollRunSummary[], companyName: string) {
  const headers = ['Period From', 'Period To', 'Employees', 'Total Gross', 'Status', 'Run By', 'Run At'];
  const rows = runs.map((r) =>
    [
      r.fromDate,
      r.toDate,
      r.employeeCount,
      r.totalGross.toFixed(2),
      r.status,
      r.createdByUsername ?? '',
      r.createdAt ? dayjs(r.createdAt).format('YYYY-MM-DD HH:mm') : '',
    ]
      .map(csvCell)
      .join(',')
  );
  const csv = [headers.join(','), ...rows].join('\n');
  triggerCsvDownload(csv, `payroll-runs-${slugify(companyName)}-${new Date().toISOString().slice(0, 10)}.csv`);
}

// The actual monthly payroll file: one row per employee paid in that run.
function downloadPayrollRunLinesCsv(run: PayrollRunDetail) {
  const headers = [
    'Employee ID No',
    'Employee Name',
    'Days in Period',
    'Present Days',
    'Basic',
    'HRA',
    'DA',
    'Others',
    'Prorated Basic',
    'Prorated HRA',
    'Prorated DA',
    'Prorated Others',
    'Gross Pay',
    'Professional Tax',
    'Provident Fund',
    'Net Pay',
  ];
  const rows = run.lines.map((l) =>
    [
      l.employeeIdNo,
      l.employeeName ?? '',
      l.daysInPeriod,
      l.presentDays,
      l.basic.toFixed(2),
      l.hra.toFixed(2),
      l.da.toFixed(2),
      l.others.toFixed(2),
      l.proratedBasic.toFixed(2),
      l.proratedHra.toFixed(2),
      l.proratedDa.toFixed(2),
      l.proratedOthers.toFixed(2),
      l.grossPay.toFixed(2),
      l.professionalTax.toFixed(2),
      l.providentFund.toFixed(2),
      l.netPay.toFixed(2),
    ]
      .map(csvCell)
      .join(',')
  );
  const csv = [headers.join(','), ...rows].join('\n');
  triggerCsvDownload(
    csv,
    `payroll-run-${run.id}-${slugify(run.customerName)}-${run.fromDate}-to-${run.toDate}.csv`
  );
}

interface AppliedFilters {
  customerId: number;
  fromDate: string;
  toDate: string;
}

export function RunPayrollPage() {
  const today = dayjs();
  const [customerId, setCustomerId] = useState<number | undefined>();
  const [fromDate, setFromDate] = useState<Dayjs>(today.startOf('month'));
  const [toDate, setToDate] = useState<Dayjs>(today);
  const [applied, setApplied] = useState<AppliedFilters | null>(null);
  const [lastRunKey, setLastRunKey] = useState<string | null>(null);
  const [downloadingRunId, setDownloadingRunId] = useState<number | null>(null);

  const { data: customers = [] } = useCustomersQuery();
  const customerOptions = useMemo(
    () => customers.filter((c) => !!c.id).map((c) => ({ value: c.id as number, label: c.name })),
    [customers]
  );

  const { data: preview, isFetching: isPreviewLoading } = usePayrollPreviewQuery(applied);
  const { data: recentRuns = [], isLoading: isRunsLoading } = usePayrollRunsQuery(customerId);
  const runMutation = useRunPayroll();
  const fetchRunMutation = useFetchPayrollRun();

  function handlePreview() {
    if (!customerId) {
      message.error('Please select a customer.');
      return;
    }
    setApplied({ customerId, fromDate: fromDate.format('YYYY-MM-DD'), toDate: toDate.format('YYYY-MM-DD') });
  }

  async function handleRunPayroll() {
    if (!applied) return;
    try {
      const run = await runMutation.mutateAsync(applied);
      setLastRunKey(`${applied.customerId}|${applied.fromDate}|${applied.toDate}`);
      message.success(`Payroll run #${run.id} completed for ${run.employeeCount} employee(s).`);
    } catch (err: any) {
      message.error(err?.response?.data?.message ?? 'Failed to run payroll.');
    }
  }

  const appliedKey = applied ? `${applied.customerId}|${applied.fromDate}|${applied.toDate}` : null;
  const alreadyRun = !!appliedKey && appliedKey === lastRunKey;

  const selectedCustomerName = customers.find((c) => c.id === customerId)?.name ?? String(customerId ?? '');

  function handleExportRunsCsv() {
    if (recentRuns.length === 0) {
      message.warning('No payroll runs to export for this customer.');
      return;
    }
    downloadPayrollRunsCsv(recentRuns, selectedCustomerName);
  }

  async function handleDownloadRun(runId: number) {
    setDownloadingRunId(runId);
    try {
      const detail = await fetchRunMutation.mutateAsync(runId);
      if (detail.lines.length === 0) {
        message.warning('This run has no employee line items.');
        return;
      }
      downloadPayrollRunLinesCsv(detail);
    } catch (err: any) {
      message.error(err?.response?.data?.message ?? 'Failed to download this payroll run.');
    } finally {
      setDownloadingRunId(null);
    }
  }

  const lineColumns = [
    {
      title: 'Employee',
      key: 'employee',
      render: (_: unknown, row: PayrollLine) => (
        <div>
          <div style={{ fontWeight: 600 }}>{row.employeeName ?? '—'}</div>
          <div style={{ fontSize: 12, color: '#94a3b8' }}>{row.employeeIdNo}</div>
        </div>
      ),
    },
    { title: 'Basic', dataIndex: 'basic', key: 'basic', align: 'right' as const, render: formatCurrency },
    { title: 'HRA', dataIndex: 'hra', key: 'hra', align: 'right' as const, render: formatCurrency },
    { title: 'DA', dataIndex: 'da', key: 'da', align: 'right' as const, render: formatCurrency },
    { title: 'Others', dataIndex: 'others', key: 'others', align: 'right' as const, render: formatCurrency },
    {
      title: 'Present / Days',
      key: 'attendance',
      align: 'center' as const,
      render: (_: unknown, row: PayrollLine) => `${row.presentDays} / ${row.daysInPeriod}`,
    },
    {
      title: 'Prorated Basic',
      dataIndex: 'proratedBasic',
      key: 'proratedBasic',
      align: 'right' as const,
      render: formatCurrency,
    },
    {
      title: 'Prorated HRA',
      dataIndex: 'proratedHra',
      key: 'proratedHra',
      align: 'right' as const,
      render: formatCurrency,
    },
    {
      title: 'Prorated DA',
      dataIndex: 'proratedDa',
      key: 'proratedDa',
      align: 'right' as const,
      render: formatCurrency,
    },
    {
      title: 'Prorated Others',
      dataIndex: 'proratedOthers',
      key: 'proratedOthers',
      align: 'right' as const,
      render: formatCurrency,
    },
    {
      title: 'Gross Pay',
      dataIndex: 'grossPay',
      key: 'grossPay',
      align: 'right' as const,
      render: (v: number) => <strong>{formatCurrency(v)}</strong>,
    },
    {
      title: 'Professional Tax',
      dataIndex: 'professionalTax',
      key: 'professionalTax',
      align: 'right' as const,
      render: formatCurrency,
    },
    {
      title: 'Provident Fund',
      dataIndex: 'providentFund',
      key: 'providentFund',
      align: 'right' as const,
      render: formatCurrency,
    },
    {
      title: 'Net Pay',
      dataIndex: 'netPay',
      key: 'netPay',
      align: 'right' as const,
      render: (v: number) => <strong>{formatCurrency(v)}</strong>,
    },
  ];

  const runColumns = [
    {
      title: 'Period',
      key: 'period',
      render: (_: unknown, run: PayrollRunSummary) => `${run.fromDate} to ${run.toDate}`,
    },
    { title: 'Employees', dataIndex: 'employeeCount', key: 'employeeCount', align: 'center' as const },
    {
      title: 'Total Gross',
      dataIndex: 'totalGross',
      key: 'totalGross',
      align: 'right' as const,
      render: formatCurrency,
    },
    { title: 'Status', dataIndex: 'status', key: 'status', render: (v: string) => <Tag color="success">{v}</Tag> },
    { title: 'Run By', dataIndex: 'createdByUsername', key: 'createdByUsername', render: (v: string) => v ?? '—' },
    { title: 'Run At', dataIndex: 'createdAt', key: 'createdAt', render: (v: string) => (v ? dayjs(v).format('D MMM YYYY, h:mm a') : '—') },
    {
      title: 'Action',
      key: 'action',
      align: 'right' as const,
      render: (_: unknown, run: PayrollRunSummary) => (
        <Button
          size="small"
          icon={<DownloadOutlined />}
          loading={downloadingRunId === run.id}
          onClick={() => handleDownloadRun(run.id)}
        >
          Download
        </Button>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>Run Payroll</h1>
        <p style={{ margin: '4px 0 0', color: '#9ca3af' }}>
          Compute and process a payroll run for a customer, prorated by attendance
        </p>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 24, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: '#475569', marginBottom: 6 }}>
              Customer <span style={{ color: '#ef4444' }}>*</span>
            </div>
            <Select
              value={customerId}
              onChange={setCustomerId}
              style={{ width: 220 }}
              placeholder="Select a customer"
              showSearch={{ optionFilterProp: 'label' }}
              options={customerOptions}
            />
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: '#475569', marginBottom: 6 }}>
              From Date <span style={{ color: '#ef4444' }}>*</span>
            </div>
            <DatePicker value={fromDate} onChange={(v) => v && setFromDate(v)} style={{ width: 160 }} allowClear={false} />
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: '#475569', marginBottom: 6 }}>
              To Date <span style={{ color: '#ef4444' }}>*</span>
            </div>
            <DatePicker value={toDate} onChange={(v) => v && setToDate(v)} style={{ width: 160 }} allowClear={false} />
          </div>
          <Button type="primary" icon={<SearchOutlined />} loading={isPreviewLoading} onClick={handlePreview}>
            Preview
          </Button>
        </div>
      </Card>

      {applied && preview && (
        <>
          <Row gutter={16} style={{ marginBottom: 16 }}>
            <Col span={8}>
              <Card>
                <Statistic title="Employees in Run" value={preview.employeeCount} />
              </Card>
            </Col>
            <Col span={8}>
              <Card>
                <Statistic title="Days in Period" value={preview.daysInPeriod} />
              </Card>
            </Col>
            <Col span={8}>
              <Card>
                <Statistic title="Total Gross" value={preview.totalGross} formatter={(v) => formatCurrency(Number(v))} />
              </Card>
            </Col>
          </Row>

          {preview.skippedEmployees.length > 0 && (
            <Alert
              type="warning"
              showIcon
              style={{ marginBottom: 16 }}
              message={`${preview.skippedEmployees.length} employee(s) skipped — no salary details set`}
              description={
                <div>
                  {preview.skippedEmployees.map((e) => (
                    <div key={e.employeeId}>
                      {e.employeeName ?? e.employeeIdNo} ({e.employeeIdNo})
                    </div>
                  ))}
                  <Link to="/employees/salary-details">Set up salary details →</Link>
                </div>
              }
            />
          )}

          <Card
            styles={{ body: { padding: 20 } }}
            style={{ marginBottom: 16 }}
            title={`${preview.customerName} · ${preview.fromDate} to ${preview.toDate}`}
            extra={
              <Popconfirm
                title="Run payroll for this period?"
                description="This creates a permanent payroll record. Corrections require a new run."
                onConfirm={handleRunPayroll}
                disabled={alreadyRun || preview.lines.length === 0}
              >
                <Button
                  type="primary"
                  icon={<PlayCircleOutlined />}
                  loading={runMutation.isPending}
                  disabled={alreadyRun || preview.lines.length === 0}
                >
                  {alreadyRun ? 'Already Run' : 'Run Payroll'}
                </Button>
              </Popconfirm>
            }
          >
            <Table
              rowKey="employeeId"
              dataSource={preview.lines}
              columns={lineColumns}
              pagination={{ pageSize: 10 }}
              scroll={{ x: 'max-content' }}
            />
          </Card>
        </>
      )}

      {customerId && (
        <Card
          styles={{ body: { padding: 20 } }}
          title="Recent Runs"
          extra={
            <Button icon={<DownloadOutlined />} onClick={handleExportRunsCsv} disabled={recentRuns.length === 0}>
              Export Summary
            </Button>
          }
        >
          <Table
            rowKey="id"
            loading={isRunsLoading}
            dataSource={recentRuns}
            columns={runColumns}
            pagination={{ pageSize: 5 }}
          />
        </Card>
      )}
    </div>
  );
}
