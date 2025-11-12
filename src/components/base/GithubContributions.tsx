'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { cn } from '~/lib/utils'
import Tooltip, { TooltipProvider } from './Tooltip'

interface Contribution {
  date: string
  count: number
  level: 0 | 1 | 2 | 3 | 4
}

interface Response {
  total: {
    [year: number]: number
    [year: string]: number // 'lastYear'
  }
  contributions: Array<Contribution>
}

interface ErrorData {
  error: string
}

interface Props {
  username: string
  tooltipEnabled: boolean
}

const ERROR_PATTERN = [
  [1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1],
  [1, 0, 0, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1],
  [1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 0, 1, 0, 1, 1, 1],
  [1, 0, 0, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1],
  [1, 1, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 1, 1, 0, 1, 0, 1],
] as const

const tooltipContent = {
  none: 'Chill day... 😴',
  low: 'Light work baby... 🌱',
  medium: 'Getting things done 💪',
  high: 'Ippo Mode! 🏋️‍♂️',
} as const

function generateErrorContributions(): Response {
  const contributions = Array.from({ length: 371 }, (_, index): Contribution => {
    const weekIndex = Math.floor(index / 7)
    const dayIndex = index % 7

    const patternStartWeek = Math.floor((53 - 19) / 2)
    const patternStartRow = Math.floor((7 - 5) / 2)
    const relativeWeek = weekIndex - patternStartWeek
    const relativeRow = dayIndex - patternStartRow

    let count = 0
    if (relativeWeek >= 0 && relativeWeek < 19 && relativeRow >= 0 && relativeRow < 5) {
      count = ERROR_PATTERN[relativeRow]?.[relativeWeek] === 1 ? 10 : 0
    }

    return {
      date: '1',
      count,
      level: 0,
    }
  })

  return {
    contributions,
    total: {
      lastYear: 0,
    },
  }
}

const DAYS_IN_WEEK = 7

function generatePlaceholderContributions(): Response {
  const contributions = Array.from(
    { length: 371 },
    (_, index): Contribution => ({
      date: new Date(Date.now() - (371 - index) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      count: 0,
      level: 0,
    })
  )

  return {
    contributions,
    total: {
      lastYear: 0,
    },
  }
}

function convertContributionToTooltip(count: number): string {
  if (count === 0) return tooltipContent.none
  if (count < 5) return tooltipContent.low
  if (count < 10) return tooltipContent.medium
  return tooltipContent.high
}

async function fetchContributions(username: string): Promise<Response> {
  const response = await fetch(`https://github-contributions-api.jogruber.de/v4/${username}?y=last`)
  const data: Response | ErrorData = await response.json()

  if (!response.ok) {
    throw Error(`Fetching GitHub contribution data for "${username}" failed: ${(data as ErrorData).error}`)
  }

  return data as Response
}

export default function GithubContributions({ username, tooltipEnabled }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [data, setData] = useState<Response | null>(generatePlaceholderContributions())
  const [errorVisible, setErrorVisible] = useState(true)

  const scrollToRight = useCallback(() => {
    if (containerRef.current) {
      containerRef.current.scrollLeft = containerRef.current.scrollWidth
    }
  }, [])

  const fetchData = useCallback(() => {
    fetchContributions(username)
      .then(setData)
      .then(scrollToRight)
      .then(() => {
        setErrorVisible(false)
      })
      .catch(() => {
        setData(generateErrorContributions())
      })
  }, [username])

  useEffect(fetchData, [fetchData])

  const weeks =
    data?.contributions.reduce<Contribution[][]>((acc, day, index) => {
      const weekIndex = Math.floor(index / DAYS_IN_WEEK)
      if (!acc[weekIndex]) {
        acc[weekIndex] = []
      }
      acc[weekIndex].push(day)
      return acc
    }, []) || []

  return (
    <TooltipProvider>
      <div ref={containerRef} className="grid grid-flow-col gap-1 overflow-x-auto py-2 px-2 max-md:px-0 scroll-smooth">
        {weeks.map((week, weekIndex) => (
          <div key={weekIndex} className="grid grid-rows-7 gap-1">
            {week.map((contribution, dayIndex) => {
              const { date, count } = contribution
              const formattedDate = new Date(date).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })

              const tooltipContent = `${formattedDate} — ${convertContributionToTooltip(count)}`

              return (
                <Tooltip key={dayIndex} content={tooltipContent} disabled={!tooltipEnabled || errorVisible}>
                  <div
                    className={cn(
                      'size-2 relative transition-colors duration-500 hover:scale-125 hover:transition-none',
                      count === 0
                        ? 'bg-zinc-200/70 dark:bg-zinc-900'
                        : count < 5
                          ? 'bg-zinc-400/70 dark:bg-zinc-700'
                          : count < 10
                            ? 'bg-zinc-500'
                            : 'bg-zinc-900 dark:bg-zinc-50'
                    )}
                  />
                </Tooltip>
              )
            })}
          </div>
        ))}
      </div>
    </TooltipProvider>
  )
}
