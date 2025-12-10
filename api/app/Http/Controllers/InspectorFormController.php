<?php

namespace App\Http\Controllers;

use App\Models\InspectorForm;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

class InspectorFormController extends Controller
{
    /**
     * Store a newly created inspector form.
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'date' => 'required|date',
            'uploader_id' => 'required|string|max:255',
            'project_address' => 'required|string|max:500',
            'notes' => 'nullable|array',
            'notes.*' => 'string',
            'videos' => 'nullable|array',
            'images' => 'nullable|array',
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
            $publicSlug = InspectorForm::generateSlug();

            // Create the form
            $form = InspectorForm::create([
                'date' => $request->date,
                'uploader_id' => $request->uploader_id,
                'project_address' => $request->project_address,
                'public_slug' => $publicSlug,
            ]);

            // Save notes
            if ($request->has('notes') && is_array($request->notes)) {
                foreach ($request->notes as $index => $note) {
                    if (!empty(trim($note))) {
                        $form->notes()->create([
                            'note' => trim($note),
                            'order' => $index,
                        ]);
                    }
                }
            }

            // Handle videos (files will be uploaded separately via public endpoint)
            // Videos array should contain file paths after upload

            // Handle images (files will be uploaded separately via public endpoint)
            // Images array should contain file paths after upload

            DB::commit();

            // Load relationships
            $form->load(['notes', 'videos', 'images']);

            // Generate public URL using frontend URL
            $frontendUrl = env('FRONTEND_URL', env('APP_URL', 'http://localhost:5173'));
            $publicUrl = rtrim($frontendUrl, '/') . "/public/form/{$publicSlug}";

            return response()->json([
                'success' => true,
                'data' => $form,
                'public_url' => $publicUrl,
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Failed to create inspector form.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Display the specified inspector form.
     */
    public function show(string $id): JsonResponse
    {
        $form = InspectorForm::with(['notes', 'videos', 'images'])
            ->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $form,
        ]);
    }
}

