<?php

namespace App\Http\Controllers;

use App\Models\AdminPunchlist;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

class PublicAdminPunchlistController extends Controller
{
    /**
     * Display the specified public admin punchlist form.
     */
    public function show(string $slug): JsonResponse
    {
        $punchlist = AdminPunchlist::with(['rooms.rows'])
            ->where('public_slug', $slug)
            ->firstOrFail();

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $punchlist->id,
                'address' => $punchlist->address,
                'date' => $punchlist->date->format('Y-m-d'),
                'assigned_technician' => $punchlist->assigned_technician,
                'rooms' => $punchlist->rooms->map(function ($room) {
                    return [
                        'id' => $room->id,
                        'room_name' => $room->room_name,
                        'rows' => $room->rows->map(function ($row) {
                            return [
                                'id' => $row->id,
                                'image_path' => $row->image_url, // Use accessor to get full URL
                                'image_name' => $row->image_name,
                                'note' => $row->note,
                                'proof_of_completion_image_path' => $row->proof_of_completion_image_url, // Use accessor to get full URL
                                'proof_of_completion_image_name' => $row->proof_of_completion_image_name,
                            ];
                        })->toArray(),
                    ];
                })->toArray(),
            ],
        ]);
    }

    /**
     * Upload proof of completion image for a row.
     */
    public function uploadProofOfCompletion(Request $request, string $slug, string $roomId, string $rowId): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'image' => 'required|file|mimes:jpeg,jpg,png,gif,webp|max:10240',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $punchlist = AdminPunchlist::where('public_slug', $slug)->firstOrFail();
            $room = $punchlist->rooms()->findOrFail($roomId);
            $row = $room->rows()->findOrFail($rowId);

            DB::beginTransaction();

            // Store the proof of completion image
            $file = $request->file('image');
            // store() returns path relative to storage disk
            $path = $file->store("admin-punchlists/{$punchlist->id}/rooms/{$room->id}/rows/{$row->id}/proof-of-completion", 'public');
            
            // Store the exact path returned by store() - this matches the actual file on disk
            // The accessor will generate the full URL when needed
            $row->update([
                'proof_of_completion_image_path' => $path, // Store path as returned by store() - matches actual file
                'proof_of_completion_image_name' => $file->getClientOriginalName(),
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Proof of completion uploaded successfully.',
                'data' => [
                    'proof_of_completion_image_path' => $row->proof_of_completion_image_url,
                    'proof_of_completion_image_name' => $row->proof_of_completion_image_name,
                ],
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Failed to upload proof of completion.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}

