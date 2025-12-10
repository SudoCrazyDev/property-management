import { useState, useEffect } from "react"
import { Plus, X, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { motion, AnimatePresence } from "motion/react"

export function NotesList({ value = [], onChange }) {
  const [notes, setNotes] = useState([])

  // Sync with external value changes
  useEffect(() => {
    if (value && value.length > 0) {
      setNotes(prevNotes => {
        const syncedNotes = value.map((text, index) => ({
          id: prevNotes[index]?.id || Date.now() + index,
          text: typeof text === 'string' ? text : text.text || text,
        }))
        return syncedNotes
      })
    } else if (value && value.length === 0) {
      setNotes([])
    }
  }, [value])

  const handleAddNote = () => {
    // Add a new empty note
    const newNote = { id: Date.now(), text: "" }
    const updatedNotes = [...notes, newNote]
    setNotes(updatedNotes)
    onChange(updatedNotes.map(n => n.text))
  }

  const handleRemoveNote = (id) => {
    const updatedNotes = notes.filter((note) => note.id !== id)
    setNotes(updatedNotes)
    onChange(updatedNotes.map(n => n.text))
  }

  const handleNoteChange = (id, text) => {
    const updatedNotes = notes.map((note) =>
      note.id === id ? { ...note, text } : note
    )
    setNotes(updatedNotes)
    onChange(updatedNotes.map(n => n.text))
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">Notes</p>
          <p className="text-xs text-muted-foreground">
            {notes.length} note{notes.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAddNote}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Note
        </Button>
      </div>

      {notes.length > 0 && (
        <div className="space-y-3">
          <AnimatePresence>
            {notes.map((note, index) => (
              <motion.div
                key={note.id}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="group relative flex gap-3 items-start p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
              >
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium text-muted-foreground">
                      Note {index + 1}
                    </span>
                    {note.text.trim() && (
                      <span className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                        <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                        Saved
                      </span>
                    )}
                  </div>
                  <Textarea
                    value={note.text}
                    onChange={(e) => handleNoteChange(note.id, e.target.value)}
                    placeholder={`Enter your note ${index + 1}...`}
                    rows={3}
                    className="resize-none border-0 bg-transparent focus-visible:ring-1 focus-visible:ring-ring"
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemoveNote(note.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {notes.length === 0 && (
        <div className="border-2 border-dashed rounded-lg p-8 text-center">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground mb-2">No notes added</p>
          <p className="text-xs text-muted-foreground">
            Click "Add Note" to create your first note
          </p>
        </div>
      )}
    </div>
  )
}

