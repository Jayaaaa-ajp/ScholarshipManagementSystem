<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Scholarship;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ScholarshipController extends Controller
{
    public function index(Request $request)
    {
        $query = Scholarship::query();
        
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }
        
        if ($request->has('search')) {
            $query->where('title', 'like', '%' . $request->search . '%')
                  ->orWhere('description', 'like', '%' . $request->search . '%');
        }
        
        $scholarships = $query->orderBy('created_at', 'desc')->paginate(10);
        
        return response()->json($scholarships);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:200',
            'description' => 'required|string',
            'provider' => 'required|string|max:200',
            'amount' => 'required|numeric',
            'deadline' => 'required|date',
            'eligibility_criteria' => 'required|string',
            'application_process' => 'required|string',
            'status' => 'required|in:active,inactive'
        ]);

        $scholarship = Scholarship::create($validated);
        
        return response()->json($scholarship, 201);
    }

    public function show($id)
    {
        $scholarship = Scholarship::findOrFail($id);
        return response()->json($scholarship);
    }

    public function update(Request $request, $id)
    {
        $scholarship = Scholarship::findOrFail($id);
        
        $validated = $request->validate([
            'title' => 'sometimes|string|max:200',
            'description' => 'sometimes|string',
            'provider' => 'sometimes|string|max:200',
            'amount' => 'sometimes|numeric',
            'deadline' => 'sometimes|date',
            'eligibility_criteria' => 'sometimes|string',
            'status' => 'sometimes|in:active,inactive'
        ]);

        $scholarship->update($validated);
        
        return response()->json($scholarship);
    }

    public function destroy($id)
    {
        $scholarship = Scholarship::findOrFail($id);
        $scholarship->delete();
        
        return response()->json(['message' => 'Scholarship deleted successfully']);
    }
}