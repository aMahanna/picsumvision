from typing import Dict, List, Optional, TypedDict

from flask_cors.decorator import cross_origin

##### populate.py ####


class AbstractImage(TypedDict):
    key: str
    author: str
    url: str


##### aql.py ####


class ArangoImage(AbstractImage):
    _id: str
    _key: str
    _rev: str
    author: str
    url: str


class Tag(TypedDict):
    _id: int
    score: float
    label: str


class ArangoImageInfo(TypedDict):
    image: ArangoImage
    bestGuess: List[str]
    tags: List[Tag]
    similar: List[ArangoImage]


class VisualizationVertice(TypedDict):
    _id: str
    _key: str
    data: str
    color: str


class VisualizationImage(TypedDict):
    _id: str
    _key: str
    author: str
    url: str
    color: Optional[str]


class VisualizationEdge(TypedDict):
    _id: str
    _key: str
    _from: str
    _to: str
    _score: float


class VisualizationConnection(TypedDict):
    i: VisualizationImage
    edges: List[VisualizationEdge]


class VisualizationData(TypedDict):
    vertices: List[VisualizationVertice]
    connections: List[VisualizationConnection]


##### search.py ####


class Node(TypedDict):
    id: str
    label: str
    color: str
    font: Dict[str, str]


class Edge(TypedDict):
    id: str
    # from: str
    to: str
    label: Optional[str]
    color: str


class ParsedVisualzationData(TypedDict):
    nodes: List[Node]
    edges: Dict[str, str]


##### googlevision.py ####


class VisionColor(TypedDict):
    color: Dict[str, int]
    score: float
    pixelFraction: float


class VisionLocation(TypedDict):
    latitude: float
    longitude: float


class VisionPoly(TypedDict):
    x: float
    y: float


class VisionGuess(TypedDict):
    label: str
    languageCode: str


class VisionAnnotation(TypedDict):
    mid: Optional[str]
    entityId: Optional[str]
    name: Optional[str]
    description: Optional[str]
    label: Optional[str]
    score: float


class LandmarkAnnotation(VisionAnnotation):
    locations: List[Dict[str, VisionLocation]]


class LocalizedObjectAnnotation(VisionAnnotation):
    boundingPoly: Dict[str, List[VisionPoly]]


class VisionWebDetection(TypedDict):
    webEntities: List[VisionAnnotation]
    bestGuessLabels: List[VisionGuess]


class VisionImageProperties(TypedDict):
    dominantColors: Dict[str, List[VisionColor]]


class VisionError(TypedDict):
    code: int
    message: str


class VisionResult(TypedDict):
    error: Optional[VisionError]
    labelAnnotations: Optional[List[VisionAnnotation]]
    landmarkAnnotations: Optional[List[VisionAnnotation]]
    webDetection: Optional[VisionWebDetection]
    localizedObjectAnnotations: Optional[List[VisionAnnotation]]
    imagePropertiesAnnotation: Optional[VisionImageProperties]
