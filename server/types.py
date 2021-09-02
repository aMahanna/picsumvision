from typing import Optional, TypedDict

from flask_cors.decorator import cross_origin

#### populate.py ####################
class AbstractImage(TypedDict):
    key: str
    author: str
    url: str


#### AQL.py ####################
class ArangoImage(AbstractImage):
    _id: str
    _key: str
    _rev: str


class Tag(TypedDict):
    _id: int
    score: float
    label: str


class ArangoImageInfo(TypedDict):
    image: ArangoImage
    bestGuess: list[str]
    tags: list[Tag]
    similar: list[ArangoImage]


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
    edges: list[VisualizationEdge]


class VisualizationData(TypedDict):
    vertices: list[VisualizationVertice]
    connections: list[VisualizationConnection]


########utils.py###################


class Node(TypedDict):
    id: str
    label: str
    color: str
    font: dict[str, str]


class ParsedVisualzationData(TypedDict):
    nodes: list[Node]
    edges: dict[str, str]


##### googlevision.py ####


class VisionColor(TypedDict):
    color: dict[str, int]
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
    locations: list[dict[str, VisionLocation]]


class LocalizedObjectAnnotation(VisionAnnotation):
    boundingPoly: dict[str, list[VisionPoly]]


class VisionWebDetection(TypedDict):
    webEntities: list[VisionAnnotation]
    bestGuessLabels: list[VisionGuess]


class VisionImageProperties(TypedDict):
    dominantColors: dict[str, list[VisionColor]]


class VisionError(TypedDict):
    code: int
    message: str


class VisionResult(TypedDict):
    error: Optional[VisionError]
    labelAnnotations: Optional[list[VisionAnnotation]]
    landmarkAnnotations: Optional[list[VisionAnnotation]]
    webDetection: Optional[VisionWebDetection]
    localizedObjectAnnotations: Optional[list[VisionAnnotation]]
    imagePropertiesAnnotation: Optional[VisionImageProperties]
