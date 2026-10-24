'use client'

import { useState } from 'react'
import { Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { GRADE_LABELS } from '@/lib/letters'
import { useAppStore } from '@/lib/store'
import { ScreenHeader } from '@/components/nk-ui'
import { toast } from '@/hooks/use-toast'

export function ChildFormScreen() {
  const editingChildId = useAppStore((s) => s.editingChildId)
  const data = useAppStore((s) => s.data)
  const addChild = useAppStore((s) => s.addChild)
  const updateChild = useAppStore((s) => s.updateChild)
  const go = useAppStore((s) => s.go)

  const editing = data.children.find((c) => c.id === editingChildId)
  const [name, setName] = useState(editing?.displayName ?? '')
  const [grade, setGrade] = useState<1 | 2 | 3>(editing?.grade ?? 1)

  const save = () => {
    const trimmed = name.trim()
    if (trimmed.length < 2) {
      toast({ title: 'نام کوتاه است', description: 'نام نمایشی کودک را وارد کنید (حداقل ۲ نویسه).', variant: 'destructive' })
      return
    }
    if (editing) {
      updateChild(editing.id, { displayName: trimmed, grade })
      toast({ title: 'پرونده به‌روزرسانی شد ✓' })
      go('specialist')
    } else {
      addChild(trimmed, grade)
      toast({ title: 'پرونده ساخته شد ✓', description: `${trimmed} آماده تمرین است.` })
      go('start')
    }
  }

  return (
    <div className="min-h-dvh flex flex-col bg-emerald-50/40">
      <ScreenHeader title={editing ? 'ویرایش پرونده' : 'ساخت پرونده کودک'} onBack={() => go(editing ? 'specialist' : 'start')} />
      <main className="flex-1 w-full max-w-2xl mx-auto px-4 py-5 space-y-5 nk-fade-up">
        <Card className="rounded-3xl border-emerald-100">
          <CardContent className="p-5 space-y-6">
            <div className="space-y-2">
              <Label htmlFor="childName">نام نمایشی کودک</Label>
              <Input
                id="childName"
                placeholder="مثلاً: آریا"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-12 text-lg rounded-2xl"
                maxLength={40}
                autoFocus
              />
              <p className="text-xs text-muted-foreground">
                فقط نام نمایشی ذخیره می‌شود؛ تصویر چهره، صوت، موقعیت مکانی یا اطلاعات پزشکی جمع‌آوری نمی‌شود.
              </p>
            </div>

            <div className="space-y-2">
              <Label>پایه تحصیلی</Label>
              <RadioGroup
                value={String(grade)}
                onValueChange={(v) => setGrade(Number(v) as 1 | 2 | 3)}
                className="grid grid-cols-3 gap-2"
              >
                {([1, 2, 3] as const).map((g) => (
                  <Label
                    key={g}
                    htmlFor={`grade-${g}`}
                    className={`flex flex-col items-center gap-1 rounded-2xl border-2 p-4 cursor-pointer transition-colors ${
                      grade === g ? 'border-emerald-500 bg-emerald-50' : 'border-emerald-100 hover:border-emerald-300'
                    }`}
                  >
                    <RadioGroupItem id={`grade-${g}`} value={String(g)} className="sr-only" />
                    <span className="text-2xl" aria-hidden>{['۱', '۲', '۳'][g - 1]}</span>
                    <span className="text-xs font-bold text-slate-700">{GRADE_LABELS[g]}</span>
                  </Label>
                ))}
              </RadioGroup>
              <p className="text-xs text-muted-foreground">
                تمرین‌ها مطابق حروف آموزشی همان پایه انتخاب می‌شوند؛ متخصص می‌تواند بعداً برنامه را تغییر دهد.
              </p>
            </div>

            <Button size="lg" className="w-full h-14 rounded-2xl text-lg font-bold" onClick={save}>
              <Save className="size-5" />
              {editing ? 'ذخیره تغییرات' : 'ایجاد پرونده'}
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
