<?php

namespace App\Http\Controllers;

use App\Models\AdminPunchlist;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

class AdminPunchlistController extends Controller
{
    /**
     * Store a newly created admin punchlist form.
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'address' => 'required|string|max:500',
            'date' => 'required|date',
            'assigned_technician' => 'nullable|string|max:255',
            'rooms' => 'nullable|array',
            'rooms.*.room_name' => 'required|string|max:255',
            'rooms.*.rows' => 'nullable|array',
            'rooms.*.rows.*.note' => 'nullable|string',
            'rooms.*.rows.*.image' => 'nullable|file|mimes:jpeg,jpg,png,gif,webp|max:10240',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            DB::beginTransaction();

            // Generate unique slug
            $publicSlug = AdminPunchlist::generateSlug();

            // Create the punchlist
            $punchlist = AdminPunchlist::create([
                'address' => $request->address,
                'date' => $request->date,
                'assigned_technician' => $request->assigned_technician,
                'public_slug' => $publicSlug,
            ]);

            // Create rooms and rows
            if ($request->has('rooms') && is_array($request->rooms)) {
                foreach ($request->rooms as $roomIndex => $roomData) {
                    $room = $punchlist->rooms()->create([
                        'room_name' => $roomData['room_name'],
                        'order' => $roomIndex,
                    ]);

                    // Handle rows for this room
                    if (isset($roomData['rows']) && is_array($roomData['rows'])) {
                        foreach ($roomData['rows'] as $rowIndex => $rowData) {
                            $rowImagePath = null;
                            $rowImageName = null;

                            // Handle image upload if present (from FormData nested array)
                            // Laravel FormData nested arrays use dot notation: rooms[0][rows][0][image]
                            $imageKey = "rooms.{$roomIndex}.rows.{$rowIndex}.image";
                            if ($request->hasFile($imageKey)) {
                                $file = $request->file($imageKey);
                                // store() returns path relative to storage disk
                                $path = $file->store("admin-punchlists/{$punchlist->id}/rooms/{$room->id}/rows", 'public');
                                
                                // Store the exact path returned by store() - this matches the actual file on disk
                                // The accessor will generate the full URL when needed
                                $rowImagePath = $path;
                                $rowImageName = $file->getClientOriginalName();
                            }

                            $room->rows()->create([
                                'image_path' => $rowImagePath,
                                'image_name' => $rowImageName,
                                'note' => $rowData['note'] ?? null,
                                'order' => $rowIndex,
                            ]);
                        }
                    }
                }
            }

            DB::commit();

            // Load relationships
            $punchlist->load(['rooms.rows']);

            // Generate public URL using frontend URL
            $frontendUrl = env('FRONTEND_URL', env('APP_URL', 'http://localhost:5173'));
            $publicUrl = rtrim($frontendUrl, '/') . "/public/punchlist/{$publicSlug}";

            return response()->json([
                'success' => true,
                'data' => $punchlist,
                'public_url' => $publicUrl,
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Failed to create admin punchlist.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Display the specified admin punchlist form.
     */
    public function show(string $id): JsonResponse
    {
        $punchlist = AdminPunchlist::with(['rooms.rows'])
            ->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $punchlist,
        ]);
    }
}

