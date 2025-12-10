<?php

namespace App\Http\Controllers;

use App\Models\InspectorForm;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

class PublicInspectorFormController extends Controller
{
    /**
     * Get inspector form by public slug.
     */
    public function show(string $slug): JsonResponse
    {
        $form = InspectorForm::with(['notes', 'videos', 'images'])
            ->where('public_slug', $slug)
            ->firstOrFail();

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $form->id,
                'date' => $form->date->format('Y-m-d'),
                'uploader' => [
                    'name' => $form->uploader_id, // uploader_id is stored as string identifier
                    'id' => $form->uploader_id,
                ],
                'project_address' => $form->project_address,
                'notes' => $form->notes->pluck('note')->toArray(),
                'videos' => $form->videos->map(function ($video) {
                    return [
                        'id' => $video->id,
                        'file_path' => $video->file_url, // Use accessor to ensure full URL
                        'file_name' => $video->file_name,
                    ];
                })->toArray(),
                'images' => $form->images->map(function ($image) {
                    return [
                        'id' => $image->id,
                        'file_path' => $image->file_url, // Use accessor to ensure full URL
                        'file_name' => $image->file_name,
                    ];
                })->toArray(),
            ],
        ]);
    }

    /**
     * Update notes for a public form.
     */
    public function updateNotes(Request $request, string $slug): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'notes' => 'required|array',
            'notes.*' => 'string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $form = InspectorForm::where('public_slug', $slug)->firstOrFail();

            DB::beginTransaction();

            // Delete existing notes
            $form->notes()->delete();

            // Create new notes
            foreach ($request->notes as $index => $note) {
                if (!empty(trim($note))) {
                    $form->notes()->create([
                        'note' => trim($note),
                        'order' => $index,
                    ]);
                }
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Notes updated successfully.',
                'data' => $form->notes->pluck('note')->toArray(),
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Failed to update notes.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Upload videos for a public form.
     */
    public function uploadVideos(Request $request, string $slug): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'videos' => 'required|array|min:1',
            'videos.*' => 'required|file|mimes:mp4,avi,mov,wmv,flv,webm|max:102400', // 100MB max
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $form = InspectorForm::where('public_slug', $slug)->firstOrFail();

            DB::beginTransaction();

            $uploadedVideos = [];
            foreach ($request->file('videos') as $index => $file) {
                // store() returns path relative to storage disk: inspector-forms/1/videos/filename.ext
                $path = $file->store("inspector-forms/{$form->id}/videos", 'public');
                
                // Store the exact path returned by store() - this matches the actual file on disk
                // The accessor will generate the full URL when needed
                $video = $form->videos()->create([
                    'file_path' => $path, // Store path as returned by store() - matches actual file
                    'file_name' => $file->getClientOriginalName(),
                    'file_size' => $file->getSize(),
                    'mime_type' => $file->getMimeType(),
                    'order' => $form->videos()->count() + $index,
                ]);

                $uploadedVideos[] = [
                    'id' => $video->id,
                    'file_path' => $video->file_url, // Use accessor to ensure full URL
                    'file_name' => $video->file_name,
                ];
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Videos uploaded successfully.',
                'data' => $uploadedVideos,
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Failed to upload videos.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Upload images for a public form.
     */
    public function uploadImages(Request $request, string $slug): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'images' => 'required|array|min:1',
            'images.*' => 'required|file|mimes:jpeg,jpg,png,gif,webp|max:10240', // 10MB max
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $form = InspectorForm::where('public_slug', $slug)->firstOrFail();

            DB::beginTransaction();

            $uploadedImages = [];
            foreach ($request->file('images') as $index => $file) {
                // store() returns path relative to storage disk: inspector-forms/1/images/filename.ext
                $path = $file->store("inspector-forms/{$form->id}/images", 'public');
                
                // Store the exact path returned by store() - this matches the actual file on disk
                // The accessor will generate the full URL when needed
                $image = $form->images()->create([
                    'file_path' => $path, // Store path as returned by store() - matches actual file
                    'file_name' => $file->getClientOriginalName(),
                    'file_size' => $file->getSize(),
                    'mime_type' => $file->getMimeType(),
                    'order' => $form->images()->count() + $index,
                ]);

                $uploadedImages[] = [
                    'id' => $image->id,
                    'file_path' => $image->file_url, // Use accessor to ensure full URL
                    'file_name' => $image->file_name,
                ];
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Images uploaded successfully.',
                'data' => $uploadedImages,
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Failed to upload images.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}

