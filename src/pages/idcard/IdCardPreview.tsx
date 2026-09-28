import { forwardRef } from 'react';
import dayjs from 'dayjs';
import type { IdCardData } from './idcard.types';

export const CARD_WIDTH_CM = 5.2;
export const CARD_HEIGHT_CM = 8.3;
// The on-screen width (px) of `.id-card-inner` below. Print scaling multiplies by this
// to shrink the fixed-px layout down to the card's real physical size (see IdCardGeneratorPage).
export const CARD_BASE_WIDTH_PX = 220;
const HEX_CLIP = 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)';

const NAVY = '#14284b';
const ORANGE = '#f2811d';
const RED = '#d92b2b';

const ADDRESS = '#3-5-107/7, Pillar No -143, Hyderguda, Hyderabad, Telangana-500048';
const WEBSITE = 'www.grkservices.in';
const EMAIL = 'grkfmservices@gmail.com';
const PHONE = '7989253713';

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, fontSize: 12 }}>
      <span style={{ width: 92, flexShrink: 0, fontWeight: 500, color: '#334155' }}>{label} :</span>
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 700, color: '#0f172a' }}>
        {value}
      </span>
    </div>
  );
}

export const IdCardPreview = forwardRef<HTMLDivElement, { data: IdCardData }>(function IdCardPreview(
  { data },
  ref,
) {
  const dob = data.dateOfBirth ? dayjs(data.dateOfBirth).format('DD-MM-YYYY') : '-';

  return (
    <div
      ref={ref}
      className="id-card"
      style={{
        position: 'relative',
        width: CARD_BASE_WIDTH_PX,
        margin: '0 auto',
        overflow: 'hidden',
        background: '#fff',
        boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)',
        aspectRatio: `${CARD_WIDTH_CM} / ${CARD_HEIGHT_CM}`,
      }}
    >
      <div
        className="id-card-inner"
        style={{ position: 'relative', display: 'flex', width: CARD_BASE_WIDTH_PX, flexDirection: 'column', aspectRatio: `${CARD_WIDTH_CM} / ${CARD_HEIGHT_CM}` }}
      >
        {/* Top-left diagonal corner flag */}
        <div
          style={{
            pointerEvents: 'none',
            position: 'absolute',
            left: 0,
            top: 0,
            height: 65,
            width: 65,
            overflow: 'hidden',
            clipPath: 'polygon(0 0, 100% 0, 0 100%)',
          }}
        >
          <div style={{ position: 'absolute', inset: 0, background: NAVY, clipPath: 'polygon(0 0, 62% 0, 0 62%)' }} />
          <div
            style={{
              position: 'absolute',
              left: -39,
              top: 19,
              width: 130,
              height: 15,
              transform: 'rotate(-45deg)',
              background: `linear-gradient(to left, ${ORANGE} 0%, ${RED} 100%)`,
            }}
          />
        </div>

        {/* Faint diagonal stripe watermark */}
        <div
          style={{
            pointerEvents: 'none',
            position: 'absolute',
            right: -23,
            top: -23,
            height: 130,
            width: 130,
            opacity: 0.06,
            backgroundImage: `repeating-linear-gradient(115deg, ${NAVY} 0px, ${NAVY} 1px, transparent 1px, transparent 14px)`,
          }}
        />

        <div style={{ padding: '4px 9px 2px' }}>
          <img
            src="/grk-logo.png"
            alt="Company logo"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = 'none';
            }}
            style={{ margin: '9px auto 2px', display: 'block', width: 105, objectFit: 'contain' }}
          />

          <div style={{ position: 'relative', margin: '2px auto 0', height: 102, width: 102 }}>
            <div style={{ position: 'absolute', inset: 0, background: ORANGE, padding: 2, clipPath: HEX_CLIP }}>
              <div style={{ height: '100%', width: '100%', background: '#fff', padding: 2, clipPath: HEX_CLIP }}>
                <div style={{ height: '100%', width: '100%', background: '#e2e8f0', clipPath: HEX_CLIP }}>
                  {data.photo ? (
                    <img src={data.photo} alt={data.employeeName || 'Employee'} style={{ height: '100%', width: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ display: 'flex', height: '100%', width: '100%', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#94a3b8' }}>
                      No Photo
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div style={{ marginTop: 2, padding: '0 5px', textAlign: 'center' }}>
            <p style={{ margin: 0, fontSize: 12, fontWeight: 800, textTransform: 'uppercase', lineHeight: 1.25, letterSpacing: '0.025em', color: NAVY }}>
              {data.employeeName || 'Employee Name'}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, margin: '2px auto 0' }}>
              <span style={{ height: 1, width: 70, background: ORANGE }} />
              <span style={{ height: 4, width: 4, borderRadius: 9999, background: ORANGE }} />
              <span style={{ height: 1, width: 70, background: ORANGE }} />
            </div>
          </div>

          <div style={{ marginTop: 2, display: 'flex', justifyContent: 'center' }}>
            <span
              style={{
                borderRadius: 9999,
                background: ORANGE,
                padding: '3px 14px',
                fontSize: 10,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.025em',
                color: '#fff',
              }}
            >
              {data.designation || 'Designation'}
            </span>
          </div>

          <div style={{ marginTop: 4, display: 'flex', flexDirection: 'column', gap: 1, padding: '0 6px' }}>
            <InfoRow label="ID NO." value={data.idNumber || '-'} />
            <InfoRow label="D.O.B." value={dob} />
            <InfoRow label="WORK PLACE" value={data.workLocation || '-'} />
            <InfoRow label="BLOOD GROUP" value={data.bloodGroup || '-'} />
            <InfoRow label="EMERGENCY NO" value={data.emergencyContact || '-'} />
          </div>
        </div>

        <div style={{ position: 'relative', marginTop: 'auto' }}>
          <svg viewBox="0 0 400 28" preserveAspectRatio="none" style={{ display: 'block', height: 9, width: '100%' }}>
            <path d="M0,16 C100,2 300,30 400,14 L400,28 L0,28 Z" fill={RED} />
            <path d="M0,10 C100,-2 300,24 400,8 L400,28 L0,28 Z" fill={ORANGE} />
          </svg>
          <div style={{ background: NAVY, padding: '4px 9px', textAlign: 'center', color: '#fff' }}>
            <p style={{ margin: 0, fontSize: 6, lineHeight: 1.25, color: 'rgba(255,255,255,0.85)' }}>
              {ADDRESS} &nbsp; Mobile: {PHONE}
            </p>
            <p style={{ margin: 0, marginTop: 0, fontSize: 7, lineHeight: 1.25 }}>
              {EMAIL} <span style={{ opacity: 0.4 }}>|</span> {WEBSITE}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
});
