// src/pages/ProjectBriefIntro.jsx
import React, { useMemo } from 'react';
import '../../../styles/game/layout/layout.css';
import '../../../styles/game/layout/Cards.css';

export default function ProjectBriefIntro({ gameData, ctx }) {
  const title = (gameData && gameData.gameTitle) || 'Project Brief';
  const rawDesc = gameData?.gameDescription || '';

  const { timePeriod, scopeStatement, budget } = useMemo(() => {
    const tryParse = (text) => {
      if (!text) return null;
      try {
        return JSON.parse(text);
      } catch (e) {
        const objMatch = text.match(/\{[\s\S]*\}/);
        if (objMatch) {
          try {
            return JSON.parse(objMatch[0]);
          } catch (e2) {
            // ignore and continue
          }
        }

        try {
          const normalized = text
            .replace(/'([^']*?)'(?=\s*:\s)/g, '"$1"')
            .replace(/:\s*'([^']*?)'/g, ': "$1"')
            .replace(/,\s*}/g, '}')
            .replace(/,\s*\]/g, ']');
          const normObjMatch = normalized.match(/\{[\s\S]*\}/);
          if (normObjMatch) return JSON.parse(normObjMatch[0]);
          return JSON.parse(normalized);
        } catch (e3) {
          return null;
        }
      }
    };

    const pickByLabel = (text, label) => {
      const re = new RegExp(`${label}\\s*:\\s*(.+?)(?=\\s+(Budget|Time|Scope)\\s*:|$)`, 'i');
      const m = text.match(re);
      return m ? m[1].trim() : '';
    };

    const extractQuotedKey = (key) => {
      const re = new RegExp(`"${key}"\\s*:\\s*"([^\"]*?)"`);
      const match = rawDesc.match(re);
      return match ? match[1] : '';
    };

    const parsed = tryParse(rawDesc);
    if (parsed && typeof parsed === 'object') {
      return {
        timePeriod: parsed.time_period || parsed.timePeriod || parsed.Time || parsed.time || '',
        scopeStatement: parsed.scope_statement || parsed.scopeStatement || parsed.scope || parsed.Scope || '',
        budget: parsed.budget || parsed.Budget || '',
      };
    }

    // 使用标签提取（处理纯文本如 'Time: ... Scope: ... Budget: ...'）
    const flat = (rawDesc || '').replace(/\s+/g, ' ').trim();
    const byLabel = {
      timePeriod: pickByLabel(flat, 'Time') || pickByLabel(flat, 'Time Period') || '',
      scopeStatement: pickByLabel(flat, 'Scope') || pickByLabel(flat, 'Scope Statement') || '',
      budget: pickByLabel(flat, 'Budget') || '',
    };
    if (byLabel.timePeriod || byLabel.scopeStatement || byLabel.budget) return byLabel;

    // 最后回退：带引号的 key 提取（原有方式）
    return {
      timePeriod: extractQuotedKey('time_period') || extractQuotedKey('timePeriod') || '',
      scopeStatement: extractQuotedKey('scope_statement') || extractQuotedKey('scopeStatement') || '',
      budget: extractQuotedKey('budget') || '',
    };
  }, [rawDesc]);

  const personas = Array.isArray(gameData?.personas) ? gameData.personas : [];
  const quizzes = Array.isArray(gameData?.quizzes) ? gameData.quizzes : [];
  const scenarios = Array.isArray(gameData?.scenarios) ? gameData.scenarios : [];

  const quizQuestionsTotal = useMemo(() => {
    return quizzes.reduce((sum, qz) => {
      const n = Array.isArray(qz.quizQuestions) ? qz.quizQuestions.length : 0;
      return sum + n;
    }, 0);
  }, [quizzes]);

  return (
    <>
      <div className="panel">
        <div className="h1">{title}</div>
        <p className="lead"><strong>Description:</strong>{} </p>
        {/* <p className="lead"><strong>Time Period:</strong> {timePeriod || '—'}</p>
        <p className="lead"><strong>Scope Statement:</strong> {scopeStatement || '—'}</p>
        <p className="lead"><strong>Budget:</strong> {budget || '—'}</p> */}

        <p className="lead" style={{ marginTop: 16 }}>
          You will first review the brief, then complete short quizzes and tackle realistic PM
          scenarios. Pay close attention to objectives, stakeholders, risks, and constraints.
        </p>

        {/* Quick meta from API */}
        <div>
          <SmallStat label="Personas" value={personas.length} />
          <SmallStat label="Quizzes" value={quizzes.length} />
          <SmallStat label="Questions" value={quizQuestionsTotal} />
          <SmallStat label="Scenarios" value={scenarios.length} />
        </div>
      </div>
    </>
  );
}

function SmallStat({ label, value }) {
  return (
    <div
      className="card"
      style={{
        padding: '10px 14px',
        borderRadius: 10,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        minWidth: 120,
        justifyContent: 'space-between',
      }}
    >
      <span style={{ opacity: 0.7 }}>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
