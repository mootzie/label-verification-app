import type { FieldResult } from '$shared/index'

export function formatFieldName(name: string): string {
    return name.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase())
}

export const STATUS_LABEL: Record<string, string> = {
    pass: 'Pass',
    warning: 'Warning',
    fail: 'Fail',
    not_found: 'Not Found',
    pending: 'Pending',
    processing: 'Processing',
    complete: 'Complete',
    failed: 'Failed',
}

export const OVERALL_LABEL: Record<string, string> = {
    pass: 'Pass',
    warning: 'Warning',
    fail: 'Fail',
}

export const BATCH_STATUS_VARIANT: Record<
    string,
    'not_found' | 'warning' | 'pass' | 'fail'
> = {
    pending: 'not_found',
    processing: 'warning',
    complete: 'pass',
    failed: 'fail',
}

export const STATUS_BORDER: Record<string, string> = {
    pass: 'border-green-400 focus:border-green-500 focus:ring-green-500',
    warning: 'border-yellow-400 focus:border-yellow-500 focus:ring-yellow-500',
    fail: 'border-red-400 focus:border-red-500 focus:ring-red-500',
    not_found: 'border-gray-300 focus:border-blue-500 focus:ring-blue-500',
}

export function borderCls(
    fieldResultMap: Map<string, FieldResult>,
    fieldName: string
): string {
    const f = fieldResultMap.get(fieldName)
    if (!f) return 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
    return (
        STATUS_BORDER[f.status] ??
        'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
    )
}
