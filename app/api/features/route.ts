import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import { 
  APP_FEATURES, 
  FEATURES_COLLECTION, 
  DEPLOYMENTS_COLLECTION,
  Feature,
  DeploymentEvent
} from '@/lib/features';

export async function GET() {
  try {
    if (!db) {
      return NextResponse.json({
        success: true,
        features: APP_FEATURES,
        count: APP_FEATURES.length,
        source: 'static',
        needsSync: true,
        updatedAt: new Date().toISOString()
      });
    }

    const snapshot = await db.collection(FEATURES_COLLECTION).get();
    
    if (snapshot.empty) {
      return NextResponse.json({
        success: true,
        features: APP_FEATURES,
        count: APP_FEATURES.length,
        source: 'static',
        needsSync: true,
        updatedAt: new Date().toISOString()
      });
    }

    const features: Feature[] = [];
    snapshot.forEach(doc => {
      features.push({ id: doc.id, ...doc.data() } as Feature);
    });

    return NextResponse.json({
      success: true,
      features,
      count: features.length,
      source: 'firestore',
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error("Error fetching features:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load features" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { featureId, updates, author, notes } = body;

    if (!featureId || !updates || !author) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    if (!db) {
      return NextResponse.json({ success: true, version: 1 });
    }

    const featureRef = db.collection(FEATURES_COLLECTION).doc(featureId);
    const featureDoc = await featureRef.get();

    if (!featureDoc.exists) {
      return NextResponse.json({ success: false, error: "Feature not found" }, { status: 404 });
    }

    const currentData = featureDoc.data() as Feature;
    const nextVersion = (currentData.version || 0) + 1;
    const timestamp = new Date().toISOString();

    const updatedFeature: Partial<Feature> = {
      ...updates,
      version: nextVersion,
      updatedAt: timestamp,
      deployedBy: author,
      deploymentNotes: notes || ''
    };

    const batch = db.batch();
    batch.update(featureRef, updatedFeature);

    const deploymentRef = db.collection(DEPLOYMENTS_COLLECTION).doc();
    const deploymentEvent: DeploymentEvent = {
      id: deploymentRef.id,
      featureId,
      version: nextVersion,
      timestamp,
      author,
      type: 'deploy',
      status: 'success',
      changes: JSON.stringify(updates)
    };
    batch.set(deploymentRef, deploymentEvent);

    await batch.commit();

    return NextResponse.json({
      success: true,
      version: nextVersion,
      feature: { ...currentData, ...updatedFeature }
    });
  } catch (error) {
    console.error("Deployment error:", error);
    return NextResponse.json({ success: false, error: "Deployment failed" }, { status: 500 });
  }
}

export async function PATCH() {
  try {
    if (!db) {
      return NextResponse.json({ success: true, message: "Features synced (static fallback)" });
    }

    const batch = db.batch();
    
    for (const feature of APP_FEATURES) {
      const ref = db.collection(FEATURES_COLLECTION).doc(feature.id);
      batch.set(ref, feature, { merge: true });
    }

    await batch.commit();
    return NextResponse.json({ success: true, message: "Features synced to Firestore" });
  } catch (error) {
    console.error("Sync error:", error);
    return NextResponse.json({ success: false, error: "Sync failed" }, { status: 500 });
  }
}
