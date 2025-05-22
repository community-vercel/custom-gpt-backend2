const express = require('express');
const router = express.Router();
const Flow = require('../models/Flow');

// Save a new flow
// routes/flow.js

// Create Flow


router.post('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { nodes, edges, flowName, websiteDomain } = req.body;
 let name = flowName || `Flow ${new Date().toLocaleString()}`;
      
      // Check if name exists for this user
      const existingFlow = await Flow.findOne({ userId: req.params.userId, name });
      if (existingFlow) {
        // Append timestamp to make it unique
        name = `${name} (${Date.now()})`;
      }
    const flow = new Flow({
      userId,
      name,
      websiteDomain,
      nodes,
      edges
    });

    const savedFlow = await flow.save();
    res.status(201).json(savedFlow);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'A flow already exists for this website domain or flow name.' });
    }
    res.status(500).json({ message: error.message });
  }
});
  
  // Update Flow
  router.put('/:userId/:flowId', async (req, res) => {
    try {
      const { nodes, edges, flowName } = req.body;
      
      // First get the current flow
      const currentFlow = await Flow.findById(req.params.flowId);
      if (!currentFlow) {
        return res.status(404).json({ message: 'Flow not found' });
      }
  
      // Check if name is being changed and if it conflicts
      if (flowName && flowName !== currentFlow.name) {
        const existingWithName = await Flow.findOne({
          userId: req.params.userId,
          name: flowName,
          _id: { $ne: req.params.flowId } // Exclude current flow
        });
        
        if (existingWithName) {
          return res.status(400).json({
            message: 'Another flow already has this name'
          });
        }
      }
  
      const updatedFlow = await Flow.findByIdAndUpdate(
        req.params.flowId,
        {
          name: flowName || currentFlow.name,
          nodes,
          edges
        },
        { new: true }
      );
  
      res.json(updatedFlow);
    } catch (error) {
      res.status(500).json({ 
        message: 'Failed to update flow',
        error: error.message 
      });
    }
  });
  
router.put('/:userId/:flowId', async (req, res) => {
  try {
    const { userId, flowId } = req.params;
    const { nodes, edges, websiteDomain } = req.body;

    const flow = await Flow.findOneAndUpdate(
      { _id: flowId, userId },
      { nodes, edges, websiteDomain },
      { new: true }
    );

    if (!flow) {
      return res.status(404).json({ message: 'Flow not found' });
    }

    res.json(flow);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'A flow already exists for this website domain.' });
    }
    res.status(500).json({ message: error.message });
  }
});


 router.get('/user/:userId', async (req, res) => {
    try {
        const flows = await Flow.find({ userId: req.params.userId })
        .sort({ updatedAt: -1 })
        .select('name updatedAt nodes edges'); // get arrays
      
      const formattedFlows = flows.map(flow => ({
        _id: flow._id,
        name: flow.name,
        websiteDomain:flow.websiteDomain,
        updatedAt: flow.updatedAt,
        nodesCount: flow.nodes?.length || 0,
        edgesCount: flow.edges?.length || 0
      }));
       // Don't return heavy data in list
      res.json(formattedFlows);
    } catch (error) {
      res.status(500).json({ 
        message: 'Failed to get flows',
        error: error.message 
      });
    }
  });

// Get all flows for a user
router.get('/:userId', async (req, res) => {
  try {
    const flows = await Flow.find({ userId: req.params.userId });
    res.json(flows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get a specific flow

  
  // Get All Flows for User
 
  
  // Get Single Flow
// routes/flow.js
router.get('/:userId/:flowId', async (req, res) => {
    try {
      console.log(`Fetching flow for userId: ${req.params.userId}, flowId: ${req.params.flowId}`); // Debug log
      const flow = await Flow.findOne({
        userId: req.params.userId,
        _id: req.params.flowId,
      });

      if (!flow) {
        console.error('Flow not found');
        return res.status(404).json({ message: 'Flow not found' });
      }
  
      res.json({
        nodes: flow.nodes,
        edges: flow.edges,
        flowName:flow.name,
        websiteDomain:flow.websiteDomain,
      });
    } catch (error) {
      console.error('Error fetching flow:', error);
      res.status(500).json({ message: 'Failed to fetch flow', error: error.message });
    }
  });
//   router.get('/:userId/:flowId', async (req, res) => {
//     try {
//       const flow = await Flow.findOne({
//         userId: req.params.userId,
//         _id: req.params.flowId
//       });
      
//       if (!flow) {
//         return res.status(404).json({ message: 'Flow not found' });
//       }
      
//       res.json(flow);
//     } catch (error) {
//       res.status(500).json({ 
//         message: 'Failed to get flow',
//         error: error.message 
//       });
//     }
//   });
  
  // Delete Flow
  router.delete('/:userId/:flowId', async (req, res) => {
    try {
      const deleted = await Flow.findOneAndDelete({
        userId: req.params.userId,
        _id: req.params.flowId
      });
      
      if (!deleted) {
        return res.status(404).json({ message: 'Flow not found' });
      }
      
      res.json({ 
        message: 'Flow deleted successfully',
        deletedId: req.params.flowId
      });
    } catch (error) {
      res.status(500).json({ 
        message: 'Failed to delete flow',
        error: error.message 
      });
    }
  });
  router.get('/check-name', async (req, res) => {
    try {
      const { userId, name } = req.query;
      if (!userId || !name) {
        return res.status(400).json({ 
          message: 'userId and name parameters are required' 
        });
      }
  
      const exists = await Flow.exists({ 
        userId, 
        name: name.trim() 
      });
      
      res.json({ 
        available: !exists,
        suggestedName: exists ? `${name.trim()} (${Date.now()})` : null
      });
    } catch (error) {
      res.status(500).json({ 
        message: 'Failed to check name availability',
        error: error.message 
      });
    }
  });
  router.get('/check-name', async (req, res) => {
    try {
      const { userId, name } = req.query;
      if (!userId || !name) {
        return res.status(400).json({ 
          message: 'userId and name parameters are required' 
        });
      }
  
      const exists = await Flow.exists({ 
        userId, 
        name: name.trim() 
      });
      
      res.json({ 
        available: !exists,
        suggestedName: exists ? `${name.trim()} (${Date.now()})` : null
      });
    } catch (error) {
      res.status(500).json({ 
        message: 'Failed to check name availability',
        error: error.message 
      });
    }
  });

  module.exports = router;