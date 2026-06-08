import type { FieldResult, FieldStatus, VerificationResult } from '$shared/index'

type ReviewStateKey = 'loading' | 'comparing' | 'error' | 'ready' | 'extracted' | 'approved' | 'warning' | 'rejected'
type FieldToneKey = FieldStatus | 'neutral'

export const GOVERNMENT_WARNING_REQUIRED = 'GOVERNMENT WARNING: (1) According to the Surgeon General, women should not drink alcoholic beverages during pregnancy because of the risk of birth defects. (2) Consumption of alcoholic beverages impairs your ability to drive a car or operate machinery, and may cause health problems.'
export const LOADING_STEPS = ['Reading label...', 'Extracting fields...', 'Checking rules...', 'Preparing review table...']

export const REVIEW_STATE_UI: Record<ReviewStateKey, { title: string; summary: string; className: string; badgeLabel: string; badgeDetail: string; badgeClass: string; dotClass: string }> = {
    loading: {
        title: 'Reading Label...',
        summary: 'Please wait while we ready the label image.',
        className: 'border-blue-200 bg-blue-50 text-blue-950',
        badgeLabel: 'Processing',
        badgeDetail: 'Reading label image',
        badgeClass: 'border-blue-200 bg-blue-50 text-blue-800',
        dotClass: 'bg-blue-500',
    },
    comparing: {
        title: 'Comparing...',
        summary: 'Comparing label against application data...',
        className: 'border-blue-200 bg-blue-50 text-blue-950',
        badgeLabel: 'Comparing',
        badgeDetail: 'Checking application values',
        badgeClass: 'border-blue-200 bg-blue-50 text-blue-800',
        dotClass: 'bg-blue-500',
    },
    error: {
        title: 'Error',
        summary: 'Could not complete verification.',
        className: 'border-red-200 bg-red-50 text-red-950',
        badgeLabel: 'Error',
        badgeDetail: 'Could not complete',
        badgeClass: 'border-red-200 bg-red-50 text-red-800',
        dotClass: 'bg-red-500',
    },
    ready: {
        title: 'Ready',
        summary: 'Upload a label image to extract fields automatically',
        className: 'border-gray-200 bg-white text-gray-900',
        badgeLabel: 'Not verified',
        badgeDetail: 'Awaiting label',
        badgeClass: 'border-gray-200 bg-white text-gray-600',
        dotClass: 'bg-gray-400',
    },
    extracted: {
        title: 'Label Extracted',
        summary: 'Fields extracted from label. Add application data below to compare.',
        className: 'border-blue-200 bg-blue-50 text-blue-950',
        badgeLabel: 'Extracted',
        badgeDetail: 'Complete',
        badgeClass: 'border-blue-200 bg-blue-50 text-blue-800',
        dotClass: 'bg-blue-500',
    },
    approved: {
        title: 'Approved',
        summary: 'All checked fields passed',
        className: 'border-green-200 bg-green-50 text-green-950',
        badgeLabel: 'Verified',
        badgeDetail: 'Complete',
        badgeClass: 'border-green-200 bg-green-50 text-green-800',
        dotClass: 'bg-green-500',
    },
    warning: {
        title: 'Review Required',
        summary: 'Potential issues found',
        className: 'border-amber-200 bg-amber-50 text-amber-950',
        badgeLabel: 'Review required',
        badgeDetail: 'Complete',
        badgeClass: 'border-amber-200 bg-amber-50 text-amber-800',
        dotClass: 'bg-amber-500',
    },
    rejected: {
        title: 'Rejected',
        summary: 'Verification failed',
        className: 'border-red-200 bg-red-50 text-red-950',
        badgeLabel: 'Failed verification',
        badgeDetail: 'Complete',
        badgeClass: 'border-red-200 bg-red-50 text-red-800',
        dotClass: 'bg-red-500',
    },
}
export const minColumnWidths = [14, 22, 22, 8]

export const FIELD_TONE_UI: Record<FieldToneKey, { glyph: string; accentClass: string; accentColor: string }> = {
    pass: { glyph: '✓', accentClass: 'bg-green-500', accentColor: '#22c55e' },
    warning: { glyph: '!', accentClass: 'bg-amber-500', accentColor: '#f59e0b' },
    fail: { glyph: '×', accentClass: 'bg-red-500', accentColor: '#ef4444' },
    not_found: { glyph: '—', accentClass: 'bg-gray-400', accentColor: '#9ca3af' },
    neutral: { glyph: '—', accentClass: 'bg-gray-400', accentColor: '#9ca3af' },
}


export const resizeColumns = (boundaryIndex: number, deltaPercent: number, commit = true, columnWidths: number[]) => {
    const next = [...columnWidths]
    const left = next[boundaryIndex]
    const right = next[boundaryIndex + 1]
    const minLeft = minColumnWidths[boundaryIndex]
    const minRight = minColumnWidths[boundaryIndex + 1]
    const allowedDelta = Math.max(minLeft - left, Math.min(deltaPercent, right - minRight))
    next[boundaryIndex] = Number((left + allowedDelta).toFixed(2))
    next[boundaryIndex + 1] = Number((right - allowedDelta).toFixed(2))
    if (commit) columnWidths = next
    return next
}

export const handleColumnResizeKeydown = (boundaryIndex: number, event: KeyboardEvent, columnWidths: number[]) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
    event.preventDefault()
    event.stopPropagation()
    resizeColumns(boundaryIndex, event.key === 'ArrowRight' ? 2 : -2, true, columnWidths)
}
