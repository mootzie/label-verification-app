import type { BatchLabelItem, VerificationResult } from '$shared/index'
import type { ReviewDecisions } from './review-types'

export function exportSingleLabelCsv(
    result: VerificationResult,
    decisions: ReviewDecisions,
    filename: string
): void {
    const header = [
        'filename',
        'field',
        'extractedValue',
        'applicationValue',
        'status',
        'reviewerDecision',
        'notes',
        'evidenceAvailable',
    ]
    const rows = result.fields.map((f) => [
        filename,
        f.fieldName,
        f.foundValue ?? '',
        f.expectedValue ?? '',
        f.status,
        decisions[f.fieldName] ?? 'unreviewed',
        f.notes ?? '',
        'no',
    ])
    const csv =
        '﻿' +
        [header, ...rows]
            .map((row) =>
                row.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')
            )
            .join('\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `verification-${filename.replace(/\.[^.]+$/, '')}.csv`
    a.click()
    URL.revokeObjectURL(url)
}

export function exportBatchCsv(
    labels: BatchLabelItem[],
    jobId: string | null
): void {
    const fieldNames = Array.from(
        new Set(
            labels.flatMap(
                (l) => l.result?.fields.map((f) => f.fieldName) ?? []
            )
        )
    )
    const header = [
        'filename',
        'overallStatus',
        'processingTimeMs',
        ...fieldNames.flatMap((fn) => [
            `${fn}_status`,
            `${fn}_expected`,
            `${fn}_found`,
            `${fn}_notes`,
        ]),
    ]
    const rows = labels.map((l) => {
        const row = [
            l.filename,
            l.result?.overallStatus ?? l.status,
            String(l.result?.processingTimeMs ?? ''),
        ]
        for (const fn of fieldNames) {
            const f = l.result?.fields.find((f) => f.fieldName === fn)
            row.push(
                f?.status ?? '',
                f?.expectedValue ?? '',
                f?.foundValue ?? '',
                f?.notes ?? ''
            )
        }
        return row
    })
    const csv =
        '﻿' +
        [header, ...rows]
            .map((row) =>
                row.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')
            )
            .join('\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `batch-${jobId ?? 'results'}.csv`
    a.click()
    URL.revokeObjectURL(url)
}
