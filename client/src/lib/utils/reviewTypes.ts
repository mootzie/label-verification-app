export type ReviewDecision =
    | 'accepted_variation'
    | 'reviewed'
    | 'escalated'
    | 'unreviewed'
export type ReviewDecisions = Record<string, ReviewDecision>
